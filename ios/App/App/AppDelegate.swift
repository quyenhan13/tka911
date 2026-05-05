import UIKit
import Capacitor
import AVFoundation

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    var silentPlayer: AVAudioPlayer?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Cấu hình Audio Session để cho phép chạy nền
        let audioSession = AVAudioSession.sharedInstance()
        do {
            try audioSession.setCategory(.playback, mode: .default, options: [.allowBluetooth, .allowAirPlay])
            try audioSession.setActive(true)
        } catch {
            print("AVAudioSession setup failed")
        }

        // Mẹo Native: Phát một đoạn âm thanh im lặng để giữ app luôn sống
        setupSilentPlayer()
        
        return true
    }

    private func setupSilentPlayer() {
        // Tạo một file âm thanh im lặng cực nhỏ (wav 16-bit)
        let SILENT_WAV_DATA: [UInt8] = [
            0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45, 0x66, 0x6d, 0x74, 0x20,
            0x10, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x44, 0xac, 0x00, 0x00, 0x88, 0x58, 0x01, 0x00,
            0x02, 0x00, 0x10, 0x00, 0x64, 0x61, 0x74, 0x61, 0x00, 0x00, 0x00, 0x00
        ]
        let data = Data(SILENT_WAV_DATA)
        do {
            silentPlayer = try AVAudioPlayer(data: data)
            silentPlayer?.numberOfLoops = -1 // Lặp vô tận
            silentPlayer?.volume = 0.01
            silentPlayer?.prepareToPlay()
            silentPlayer?.play()
        } catch {
            print("Silent player setup failed")
        }
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // App chuẩn bị thoát -> Kích hoạt trình phát im lặng ngay lập tức
        try? AVAudioSession.sharedInstance().setActive(true)
        silentPlayer?.play()
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Giữ app sống thêm một thời gian
        var backgroundTask: UIBackgroundTaskIdentifier = .invalid
        backgroundTask = application.beginBackgroundTask {
            application.endBackgroundTask(backgroundTask)
            backgroundTask = .invalid
        }
        // Chơi nhạc im lặng liên tục
        silentPlayer?.play()
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        let audioSession = AVAudioSession.sharedInstance()
        try? audioSession.setActive(true, options: [])
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
