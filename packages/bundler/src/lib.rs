use std::{fs, path::{Path, PathBuf}, collections::{HashMap, HashSet}};
use swc_common::{sync::Lrc, SourceMap, FileName};
use swc_ecma_parser::{Parser, StringInput, Syntax, EsConfig};
use swc_ecma_ast::*;
use swc_ecma_visit::{Visit, visit_program};

// Simple dependency graph builder and tree shaker (removes unused exports)
#[derive(Debug, Default, Clone)]
pub struct ModuleInfo { pub id: String, pub imports: Vec<String>, pub exports: HashSet<String>, pub used_symbols: HashSet<String> }

struct ImportExportVisitor<'a> { info: &'a mut ModuleInfo }
impl<'a> Visit for ImportExportVisitor<'a> {
    fn visit_module_decl(&mut self, n: &ModuleDecl) {
        match n { ModuleDecl::Import(i) => { if let Some(src) = i.src.value.to_string().strip_suffix(".ts") { self.info.imports.push(format!("{}.ts", src)); } else { self.info.imports.push(i.src.value.to_string()); } }, ModuleDecl::ExportDecl(ex) => {
            match &ex.decl { Decl::Var(v) => {
                for d in &v.decls { if let Pat::Ident(bi) = &d.name { self.info.exports.insert(bi.id.sym.to_string()); } }
            }, Decl::Fn(f) => { self.info.exports.insert(f.ident.sym.to_string()); }, Decl::Class(c) => { self.info.exports.insert(c.ident.sym.to_string()); }, _ => {} }
        }, ModuleDecl::ExportNamed(named) => { for s in &named.specifiers { if let ExportSpecifier::Named(ne) = s { self.info.exports.insert(ne.orig.sym().to_string()); } } }, _ => {} }
    }
}

// Visitor to collect identifier usages
struct UsageVisitor<'a> { symbols: &'a mut HashSet<String> }
impl<'a> Visit for UsageVisitor<'a> {
    fn visit_ident(&mut self, i: &Ident) { self.symbols.insert(i.sym.to_string()); }
}

pub struct Graph { pub modules: HashMap<String, ModuleInfo> }
impl Graph { pub fn new() -> Self { Graph { modules: HashMap::new() } } }

fn parse_module(path: &Path) -> anyhow::Result<ModuleInfo> {
    let src = fs::read_to_string(path)?;
    let cm: Lrc<SourceMap> = Default::default();
    let fm = cm.new_source_file(FileName::Real(path.to_path_buf()), src.clone());
    let mut parser = Parser::new(Syntax::Es(EsConfig { ..Default::default() }), StringInput::from(&*fm), None);
    let mut info = ModuleInfo { id: path.to_string_lossy().to_string(), ..Default::default() };
    if let Ok(program) = parser.parse_program() {
        let mut vis = ImportExportVisitor { info: &mut info };
        visit_program(&mut vis, &program);
        let mut usage = UsageVisitor { symbols: &mut info.used_symbols };
        visit_program(&mut usage, &program);
    }
    Ok(info)
}

pub fn build_graph(entry: &Path) -> anyhow::Result<Graph> {
    let mut graph = Graph::new();
    fn walk(path: PathBuf, graph: &mut Graph) -> anyhow::Result<()> {
        if graph.modules.contains_key(path.to_str().unwrap()) { return Ok(()); }
        let info = parse_module(&path)?;
        let imports = info.imports.clone();
        graph.modules.insert(path.to_string_lossy().to_string(), info);
        for imp in imports { let p = if imp.starts_with('.') { path.parent().unwrap().join(imp) } else { continue }; walk(p, graph)?; }
        Ok(())
    }
    walk(entry.to_path_buf(), &mut graph)?;
    Ok(graph)
}

pub fn tree_shake(graph: &Graph, entry: &str) -> HashSet<String> {
    // Enhanced: propagate symbol usage: if a module export name appears in dependent usage sets, retain it.
    let mut keep: HashSet<String> = HashSet::new();
    // First, gather reachable modules.
    let mut reachable: HashSet<String> = HashSet::new();
    fn dfs(id: &str, graph: &Graph, set: &mut HashSet<String>) {
        if !set.insert(id.to_string()) { return; }
        if let Some(info) = graph.modules.get(id) {
            for imp in &info.imports {
                if imp.starts_with('.') { let next = normalize_path(id, imp); dfs(&next, graph, set); }
            }
        }
    }
    dfs(entry, graph, &mut reachable);
    // Build reverse dependency map
    let mut reverse: HashMap<String, Vec<String>> = HashMap::new();
    for (id, info) in &graph.modules {
        for imp in &info.imports { if imp.starts_with('.') { let next = normalize_path(id, imp); reverse.entry(next).or_default().push(id.clone()); } }
    }
    // Worklist for symbols: start with all identifiers used in entry module body.
    let mut symbol_queue: Vec<(String,String)> = Vec::new();
    if let Some(entry_info) = graph.modules.get(entry) {
        for sym in &entry_info.used_symbols { symbol_queue.push((entry.to_string(), sym.clone())); }
    }
    while let Some((mod_id, sym)) = symbol_queue.pop() {
        if let Some(info) = graph.modules.get(&mod_id) {
            if info.exports.contains(&sym) {
                keep.insert(format!("{}::{}", mod_id, sym));
            }
        }
        if let Some(parents) = reverse.get(&mod_id) {
            for p in parents {
                if let Some(pinfo) = graph.modules.get(p) {
                    if pinfo.used_symbols.contains(&sym) {
                        // propagate
                        symbol_queue.push((p.clone(), sym.clone()));
                    }
                }
            }
        }
    }
    // Always keep all exports of entry for now (guarantee app entry correctness)
    if let Some(entry_info) = graph.modules.get(entry) { for e in &entry_info.exports { keep.insert(format!("{}::{}", entry, e)); } }
    keep
}

fn normalize_path(base: &str, rel: &str) -> String {
    let p = Path::new(base).parent().unwrap_or(Path::new("."));
    p.join(rel).to_string_lossy().to_string()
}

// Incremental cache (in-memory) for future runs
use once_cell::sync::Lazy;
use std::sync::Mutex;
static GRAPH_CACHE: Lazy<Mutex<HashMap<String, Graph>>> = Lazy::new(|| Mutex::new(HashMap::new()));

pub fn cached_graph(entry: &Path) -> anyhow::Result<Graph> {
    let key = entry.to_string_lossy().to_string();
    let mut cache = GRAPH_CACHE.lock().unwrap();
    if let Some(g) = cache.get(&key) { return Ok(g.clone()); }
    let g = build_graph(entry)?;
    cache.insert(key, g.clone());
    Ok(g)
}
