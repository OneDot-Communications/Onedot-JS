use std::path::PathBuf;
use std::io::{self, Read};
use serde::Serialize;
mod lib;
use lib::{build_graph, tree_shake};

#[derive(Serialize)]
struct BundleGraphSer {
  modules: Vec<ModuleSer>
}
#[derive(Serialize)]
struct ModuleSer { id: String, exports: Vec<String>, imports: Vec<String> }

fn main() -> anyhow::Result<()> {
  let mut args = std::env::args().skip(1);
  let entry = args.next().expect("entry path required");
  let graph = build_graph(&PathBuf::from(&entry))?;
  let keep = tree_shake(&graph, &entry);
  let mut modules = Vec::new();
  for (id, info) in graph.modules.iter() { modules.push(ModuleSer { id: id.clone(), exports: info.exports.iter().cloned().collect(), imports: info.imports.clone() }); }
  let out = BundleGraphSer { modules };
  println!("{}", serde_json::to_string(&out)?);
  Ok(())
}