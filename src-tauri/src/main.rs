#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{
    App, AppHandle, CustomMenuItem, LogicalSize, Menu, MenuEntry, Submenu, SystemTray,
    SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust! 111", name)
}

use device_query::{DeviceQuery, DeviceState, Keycode};
use tauri::{Manager, Window};

#[derive(Clone, serde::Serialize)]
struct Payload {
    message: String,
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let easy_window = create_easy_window(&app.app_handle());
            easy_window.set_size(LogicalSize::new(800, 400)).unwrap();
            easy_window.hide().unwrap();

            // 根据label获取窗口实例
            let complex_window = create_complex_window(&app.app_handle());
            complex_window
                .set_size(LogicalSize::new(800, 600))
                .expect("failed to set size");

            let app_handle = app.app_handle();
            std::thread::spawn(move || {
                let device_state = DeviceState::new();
                loop {
                    let keys: Vec<Keycode> = device_state.get_keys();
                    let show = keys.contains(&Keycode::LAlt) && keys.contains(&Keycode::Space);
                    if show {
                        let complex = app_handle.get_window("complex");
                        if complex.is_some() {
                            complex_window.hide().unwrap();
                        }
                        let easy = app_handle.get_window("easy").unwrap();
                        easy.show().unwrap();
                        easy.set_focus().unwrap();
                        std::thread::sleep(std::time::Duration::from_millis(100));
                    }
                }
            });
            Ok(())
        })
        .system_tray(menu())
        .on_system_tray_event(system_try_handler)
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn create_complex_window(app: &AppHandle) -> Window {
    tauri::WindowBuilder::new(
        app,
        "complex",
        tauri::WindowUrl::App("complex".parse().unwrap()),
    )
    .decorations(true)
    .resizable(true)
    .visible(true)
    .accept_first_mouse(true)
    .build()
    .expect("failed to build window")
}

fn create_easy_window(app: &AppHandle) -> Window {
    let window = tauri::WindowBuilder::new(
        app,
        "easy", /* the unique window label */
        tauri::WindowUrl::App("easy".parse().unwrap()),
    )
    .decorations(false)
    .resizable(false)
    .visible(true)
    .build()
    .expect("failed to build window");
    window.set_size(LogicalSize::new(800, 200)).unwrap();
    window
}

pub fn menu() -> SystemTray {
    // 定义系统托盘
    let open_main = CustomMenuItem::new("open_main".to_string(), "打开主界面");
    let mut quit = CustomMenuItem::new("quit".to_string(), "退出");
    let mut spotlight = CustomMenuItem::new("spotlight".to_string(), "进入Spotlight模式");
    // 设置菜单快捷键
    quit = quit.accelerator("Command+Q");
    spotlight = spotlight.accelerator("Option+Space");
    let tray_menu = SystemTrayMenu::new()
        .add_item(open_main)
        // .add_item(q_clipboard)
        .add_item(spotlight)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);

    SystemTray::new().with_menu(tray_menu)
}

fn system_try_handler(app: &AppHandle, event: SystemTrayEvent) {
    match event {
        SystemTrayEvent::MenuItemClick { id, .. } => {
            match id.as_str() {
                // 退出
                "quit" => {
                    std::process::exit(0);
                }
                // 快捷搜索
                "spotlight" => show_window(app, String::from("easy")),
                "open_main" => show_window(app, String::from("complex")),
                _ => {}
            }
        }
        _ => {}
    }
}

fn show_window(app: &AppHandle, t: String) {
    if t.eq("easy") {
        let complex_window = app.get_window("complex");
        if complex_window.is_some() {
            complex_window.unwrap().hide().unwrap();
        }

        let easy_window = app.get_window("easy");
        if easy_window.is_some() {
            let easy_window = easy_window.unwrap();
            easy_window.show().unwrap();
            easy_window.set_focus().unwrap();
        }
    }
    if t.eq("complex") {
        let easy_window = app.get_window("easy");
        if easy_window.is_some() {
            easy_window.unwrap().hide().unwrap();
        }

        let complex_window = app.get_window("complex");
        if complex_window.is_some() {
            complex_window.unwrap().show().unwrap();
        } else {
            create_complex_window(&app.app_handle());
        }
    }
}
