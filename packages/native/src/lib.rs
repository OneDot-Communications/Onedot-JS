use skia_safe::{Canvas, Surface, Paint, Color, Point, Rect, Path};
use std::sync::{Arc, Mutex, RwLock};
use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use crossbeam_channel::{unbounded, Receiver, Sender};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RendererConfig {
    pub enable_gpu: bool,
    pub vsync: bool,
    pub msaa: u32,
    pub color_space: String,
    pub thread_pool_size: Option<usize>,
}

#[derive(Debug, Clone)]
pub struct NativeSurface {
    pub id: String,
    pub width: i32,
    pub height: i32,
    pub scale: f32,
    surface: Arc<Mutex<Option<Surface>>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VNode {
    pub node_type: String,
    pub props: serde_json::Value,
    pub children: Vec<VNode>,
    pub key: Option<String>,
}

#[derive(Debug, Clone)]
pub struct LayoutMetrics {
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
}

#[derive(Debug, Clone)]
pub struct NativeNode {
    pub id: u64,
    pub node_type: String,
    pub props: serde_json::Value,
    pub layout: LayoutMetrics,
    pub children: Vec<u64>,
    pub parent: Option<u64>,
}

pub struct SkiaRenderer {
    config: RendererConfig,
    surfaces: RwLock<HashMap<String, NativeSurface>>,
    nodes: RwLock<HashMap<u64, NativeNode>>,
    render_queue: (Sender<RenderCommand>, Receiver<RenderCommand>),
    next_node_id: std::sync::atomic::AtomicU64,
}

#[derive(Debug)]
enum RenderCommand {
    CreateSurface { id: String, width: i32, height: i32 },
    RenderTree { surface_id: String, root: VNode },
    UpdateNode { id: u64, props: serde_json::Value },
    Flush { surface_id: String },
}

impl SkiaRenderer {
    pub fn new(config: RendererConfig) -> Self {
        let (sender, receiver) = unbounded();
        
        Self {
            config,
            surfaces: RwLock::new(HashMap::new()),
            nodes: RwLock::new(HashMap::new()),
            render_queue: (sender, receiver),
            next_node_id: std::sync::atomic::AtomicU64::new(1),
        }
    }

    pub fn initialize(&self) -> Result<(), Box<dyn std::error::Error>> {
        // Initialize Skia GPU context based on platform
        #[cfg(target_os = "windows")]
        self.init_d3d()?;
        
        #[cfg(target_os = "macos")]
        self.init_metal()?;
        
        #[cfg(target_os = "linux")]
        self.init_vulkan()?;
        
        #[cfg(target_os = "android")]
        self.init_gles()?;
        
        #[cfg(target_os = "ios")]
        self.init_metal_ios()?;

        Ok(())
    }

    pub fn create_surface(&self, id: String, width: i32, height: i32) -> NativeSurface {
        let surface = NativeSurface {
            id: id.clone(),
            width,
            height,
            scale: 1.0,
            surface: Arc::new(Mutex::new(None)),
        };

        // Create actual Skia surface
        if let Ok(mut surfaces) = self.surfaces.write() {
            surfaces.insert(id.clone(), surface.clone());
        }

        self.render_queue.0.send(RenderCommand::CreateSurface { id, width, height }).ok();
        surface
    }

    pub fn render(&self, surface_id: &str, vnode: VNode) -> Result<(), Box<dyn std::error::Error>> {
        self.render_queue.0.send(RenderCommand::RenderTree { 
            surface_id: surface_id.to_string(), 
            root: vnode 
        })?;
        Ok(())
    }

    fn process_render_commands(&self) {
        while let Ok(command) = self.render_queue.1.try_recv() {
            match command {
                RenderCommand::CreateSurface { id, width, height } => {
                    self.create_skia_surface(&id, width, height);
                }
                RenderCommand::RenderTree { surface_id, root } => {
                    self.render_vnode_tree(&surface_id, &root);
                }
                RenderCommand::UpdateNode { id, props } => {
                    self.update_node_props(id, props);
                }
                RenderCommand::Flush { surface_id } => {
                    self.flush_surface(&surface_id);
                }
            }
        }
    }

    fn create_skia_surface(&self, id: &str, width: i32, height: i32) {
        // Platform-specific surface creation
        if let Ok(surfaces) = self.surfaces.read() {
            if let Some(surface_wrapper) = surfaces.get(id) {
                if let Ok(mut surface_guard) = surface_wrapper.surface.lock() {
                    let surface = if self.config.enable_gpu {
                        // GPU-accelerated surface
                        Surface::new_render_target(
                            &self.get_gpu_context(),
                            skia_safe::Budgeted::Yes,
                            &skia_safe::ImageInfo::new(
                                (width, height),
                                skia_safe::ColorType::RGBA8888,
                                skia_safe::AlphaType::Premul,
                                None,
                            ),
                            Some(self.config.msaa as usize),
                            None,
                            None,
                        )
                    } else {
                        // CPU-based surface
                        Surface::new_raster_n32_premul((width, height))
                    };
                    
                    *surface_guard = surface;
                }
            }
        }
    }

    fn render_vnode_tree(&self, surface_id: &str, vnode: &VNode) {
        if let Ok(surfaces) = self.surfaces.read() {
            if let Some(surface_wrapper) = surfaces.get(surface_id) {
                if let Ok(mut surface_guard) = surface_wrapper.surface.lock() {
                    if let Some(ref mut surface) = *surface_guard {
                        let canvas = surface.canvas();
                        canvas.clear(Color::WHITE);
                        
                        // Render the VNode tree
                        self.render_vnode(canvas, vnode, 0.0, 0.0);
                        
                        // Flush to screen
                        surface.flush();
                    }
                }
            }
        }
    }

    fn render_vnode(&self, canvas: &mut Canvas, vnode: &VNode, x: f32, y: f32) {
        match vnode.node_type.as_str() {
            "view" => self.render_view(canvas, vnode, x, y),
            "text" => self.render_text(canvas, vnode, x, y),
            "image" => self.render_image(canvas, vnode, x, y),
            "button" => self.render_button(canvas, vnode, x, y),
            _ => {
                // Custom component - render children
                for child in &vnode.children {
                    self.render_vnode(canvas, child, x, y);
                }
            }
        }
    }

    fn render_view(&self, canvas: &mut Canvas, vnode: &VNode, x: f32, y: f32) {
        let props = &vnode.props;
        
        // Extract layout properties
        let width = props.get("width").and_then(|v| v.as_f64()).unwrap_or(100.0) as f32;
        let height = props.get("height").and_then(|v| v.as_f64()).unwrap_or(100.0) as f32;
        
        // Extract style properties
        let bg_color = props.get("backgroundColor")
            .and_then(|v| v.as_str())
            .and_then(|s| self.parse_color(s))
            .unwrap_or(Color::TRANSPARENT);
            
        let border_radius = props.get("borderRadius")
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0) as f32;

        // Create paint
        let mut paint = Paint::new(bg_color, None);
        paint.set_anti_alias(true);

        // Draw background
        if border_radius > 0.0 {
            let rect = Rect::from_xywh(x, y, width, height);
            let mut path = Path::new();
            path.add_rounded_rect(rect, (border_radius, border_radius), None);
            canvas.draw_path(&path, &paint);
        } else {
            let rect = Rect::from_xywh(x, y, width, height);
            canvas.draw_rect(rect, &paint);
        }

        // Render children with layout
        self.layout_children(canvas, &vnode.children, x, y, width, height);
    }

    fn render_text(&self, canvas: &mut Canvas, vnode: &VNode, x: f32, y: f32) {
        let props = &vnode.props;
        let text = props.get("children").and_then(|v| v.as_str()).unwrap_or("");
        let font_size = props.get("fontSize").and_then(|v| v.as_f64()).unwrap_or(16.0) as f32;
        let color = props.get("color")
            .and_then(|v| v.as_str())
            .and_then(|s| self.parse_color(s))
            .unwrap_or(Color::BLACK);

        let mut paint = Paint::new(color, None);
        paint.set_anti_alias(true);
        
        // TODO: Implement proper text rendering with font management
        // For now, using basic text drawing
        canvas.draw_str(text, Point::new(x, y + font_size), &paint);
    }

    fn render_image(&self, _canvas: &mut Canvas, _vnode: &VNode, _x: f32, _y: f32) {
        // TODO: Implement image rendering with texture loading
    }

    fn render_button(&self, canvas: &mut Canvas, vnode: &VNode, x: f32, y: f32) {
        // Render as view with button-specific styling
        self.render_view(canvas, vnode, x, y);
        
        // Add button-specific effects (shadow, highlight, etc.)
        // TODO: Implement button state management
    }

    fn layout_children(&self, canvas: &mut Canvas, children: &[VNode], parent_x: f32, parent_y: f32, parent_width: f32, _parent_height: f32) {
        let mut current_y = parent_y;
        
        for child in children {
            let child_height = child.props.get("height")
                .and_then(|v| v.as_f64())
                .unwrap_or(50.0) as f32;
                
            self.render_vnode(canvas, child, parent_x, current_y);
            current_y += child_height;
        }
    }

    fn parse_color(&self, color_str: &str) -> Option<Color> {
        // Simple color parsing - extend for full CSS color support
        match color_str {
            "red" => Some(Color::RED),
            "green" => Some(Color::GREEN),
            "blue" => Some(Color::BLUE),
            "black" => Some(Color::BLACK),
            "white" => Some(Color::WHITE),
            "transparent" => Some(Color::TRANSPARENT),
            _ => {
                // Try hex parsing
                if color_str.starts_with('#') && color_str.len() == 7 {
                    if let Ok(hex) = u32::from_str_radix(&color_str[1..], 16) {
                        return Some(Color::from_argb(
                            255,
                            ((hex >> 16) & 0xFF) as u8,
                            ((hex >> 8) & 0xFF) as u8,
                            (hex & 0xFF) as u8,
                        ));
                    }
                }
                None
            }
        }
    }

    fn get_gpu_context(&self) -> skia_safe::gpu::DirectContext {
        // Platform-specific GPU context creation
        // This is a simplified version - real implementation would be platform-specific
        unimplemented!("GPU context creation is platform-specific")
    }

    fn update_node_props(&self, id: u64, props: serde_json::Value) {
        if let Ok(mut nodes) = self.nodes.write() {
            if let Some(node) = nodes.get_mut(&id) {
                node.props = props;
            }
        }
    }

    fn flush_surface(&self, surface_id: &str) {
        if let Ok(surfaces) = self.surfaces.read() {
            if let Some(surface_wrapper) = surfaces.get(surface_id) {
                if let Ok(mut surface_guard) = surface_wrapper.surface.lock() {
                    if let Some(ref mut surface) = *surface_guard {
                        surface.flush();
                    }
                }
            }
        }
    }

    #[cfg(target_os = "windows")]
    fn init_d3d(&self) -> Result<(), Box<dyn std::error::Error>> {
        // D3D11 initialization for Windows
        Ok(())
    }

    #[cfg(any(target_os = "macos", target_os = "ios"))]
    fn init_metal(&self) -> Result<(), Box<dyn std::error::Error>> {
        // Metal initialization for macOS
        Ok(())
    }

    #[cfg(target_os = "ios")]
    fn init_metal_ios(&self) -> Result<(), Box<dyn std::error::Error>> {
        // Metal initialization for iOS
        Ok(())
    }

    #[cfg(target_os = "linux")]
    fn init_vulkan(&self) -> Result<(), Box<dyn std::error::Error>> {
        // Vulkan initialization for Linux
        Ok(())
    }

    #[cfg(target_os = "android")]
    fn init_gles(&self) -> Result<(), Box<dyn std::error::Error>> {
        // OpenGL ES initialization for Android
        Ok(())
    }
}

// JSI Bridge implementation
pub struct JSIBridge {
    callbacks: RwLock<HashMap<String, Box<dyn Fn(&[serde_json::Value]) -> serde_json::Value + Send + Sync>>>,
    turbo_modules: RwLock<HashMap<String, TurboModuleSpec>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TurboModuleSpec {
    pub methods: HashMap<String, MethodSpec>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MethodSpec {
    pub signature: String,
    pub sync: bool,
    pub thread_safe: bool,
}

impl JSIBridge {
    pub fn new() -> Self {
        Self {
            callbacks: RwLock::new(HashMap::new()),
            turbo_modules: RwLock::new(HashMap::new()),
        }
    }

    pub fn invoke_native(&self, module: &str, method: &str, args: &[serde_json::Value]) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
        // Route to appropriate native module
        match module {
            "Renderer" => self.handle_renderer_call(method, args),
            "Animation" => self.handle_animation_call(method, args),
            "Gesture" => self.handle_gesture_call(method, args),
            "Platform" => self.handle_platform_call(method, args),
            _ => Err(format!("Unknown module: {}", module).into()),
        }
    }

    fn handle_renderer_call(&self, method: &str, args: &[serde_json::Value]) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
        match method {
            "createSurface" => {
                let width = args.get(0).and_then(|v| v.as_i64()).unwrap_or(800) as i32;
                let height = args.get(1).and_then(|v| v.as_i64()).unwrap_or(600) as i32;
                let id = format!("surface_{}", chrono::Utc::now().timestamp_nanos());
                Ok(serde_json::json!({ "id": id, "width": width, "height": height }))
            }
            "render" => {
                // Handle render call
                Ok(serde_json::json!({ "success": true }))
            }
            _ => Err(format!("Unknown renderer method: {}", method).into()),
        }
    }

    fn handle_animation_call(&self, method: &str, _args: &[serde_json::Value]) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
        match method {
            "startAnimation" => Ok(serde_json::json!({ "animationId": "anim_123" })),
            "stopAnimation" => Ok(serde_json::json!({ "success": true })),
            _ => Err(format!("Unknown animation method: {}", method).into()),
        }
    }

    fn handle_gesture_call(&self, method: &str, _args: &[serde_json::Value]) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
        match method {
            "recognizeTap" => Ok(serde_json::json!({ "recognized": true })),
            "recognizePan" => Ok(serde_json::json!({ "recognized": true })),
            _ => Err(format!("Unknown gesture method: {}", method).into()),
        }
    }

    fn handle_platform_call(&self, method: &str, _args: &[serde_json::Value]) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
        match method {
            "getDeviceInfo" => Ok(serde_json::json!({
                "platform": std::env::consts::OS,
                "arch": std::env::consts::ARCH,
                "cores": num_cpus::get()
            })),
            _ => Err(format!("Unknown platform method: {}", method).into()),
        }
    }
}

// Export C interface for FFI
#[no_mangle]
pub extern "C" fn create_skia_renderer(config_json: *const std::os::raw::c_char) -> *mut SkiaRenderer {
    let config_str = unsafe {
        std::ffi::CStr::from_ptr(config_json).to_str().unwrap_or("{}")
    };
    
    let config: RendererConfig = serde_json::from_str(config_str).unwrap_or(RendererConfig {
        enable_gpu: true,
        vsync: true,
        msaa: 4,
        color_space: "srgb".to_string(),
        thread_pool_size: None,
    });

    let renderer = SkiaRenderer::new(config);
    Box::into_raw(Box::new(renderer))
}

#[no_mangle]
pub extern "C" fn destroy_skia_renderer(renderer: *mut SkiaRenderer) {
    if !renderer.is_null() {
        unsafe {
            Box::from_raw(renderer);
        }
    }
}

#[no_mangle]
pub extern "C" fn create_jsi_bridge() -> *mut JSIBridge {
    let bridge = JSIBridge::new();
    Box::into_raw(Box::new(bridge))
}

#[no_mangle]
pub extern "C" fn destroy_jsi_bridge(bridge: *mut JSIBridge) {
    if !bridge.is_null() {
        unsafe {
            Box::from_raw(bridge);
        }
    }
}
