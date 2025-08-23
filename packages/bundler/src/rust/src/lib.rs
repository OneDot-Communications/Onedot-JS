use std::path::Path;
use swc::{config::Config, try_with_handler, Compiler};
use swc_common::{errors::ColorConfig, FileName, SourceMap};
use swc_ecma_parser::{Parser, StringInput, TsConfig};
use swc_ecma_transforms::typescript::strip;
use swc_ecma_codegen::{text_writer::JsWriter, Emitter};

pub fn bundle(entry: &Path) -> Result<String, Box<dyn std::error::Error>> {
    let cm = SourceMap::default();
    let fm = cm.load_file(entry)?;
    
    let compiler = Compiler::new(cm.clone());
    let output = try_with_handler(cm.clone(), ColorConfig::Auto, |handler| {
        let mut parser = Parser::new(
            TsConfig {
                tsx: false,
                ..Default::default()
            },
            StringInput::from(&*fm.src.as_str()),
            None,
        );
        
        let module = parser.parse_module().map_err(|e| e.into_diagnostic(handler).emit())?;
        
        let module = compiler.run(|| {
            strip(module, Default::default())
        })?;
        
        let mut buf = Vec::new();
        {
            let mut emitter = Emitter {
                cfg: swc_ecma_codegen::Config::default(),
                cm: cm.clone(),
                comments: None,
                wr: JsWriter::new(cm, "\n", &mut buf, None),
            };
            
            emitter.emit_module(&module)?;
        }
        
        Ok(String::from_utf8(buf)?)
    })?;
    
    Ok(output)
}
