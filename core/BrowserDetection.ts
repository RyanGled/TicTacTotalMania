class BrowserDetection {

    public static Android(): boolean {
        return navigator.userAgent.match(/Android/i) != null;
    }

    public static BlackBerry(): boolean {
        return navigator.userAgent.match(/BlackBerry/i) != null;
    }

    public static iOSMobile(): boolean {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i) != null;
    }

    public static OperaMobile(): boolean {
        return navigator.userAgent.match(/Opera Mini/i) != null;
    }

    public static WindowsMobile(): boolean {
        return navigator.userAgent.match(/IEMobile/i) != null || navigator.userAgent.match(/WPDesktop/i) != null;
    }

    public static AnyMobile(): boolean {
        return (BrowserDetection.Android() || BrowserDetection.BlackBerry() || BrowserDetection.iOSMobile() || BrowserDetection.OperaMobile() || BrowserDetection.WindowsMobile());
    }

    public static InternetExplorer(): boolean {
        return (!((<any>window).ActiveXObject) && "ActiveXObject" in window);
    }

    public static Safari(): boolean {
        return !!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/);
    }

    public static Cipher(): boolean {
        return navigator.userAgent.match(/Cipher/i) != null;
    }

    public static Chrome(): boolean {
        return navigator.userAgent.toLowerCase().match(/chrome/i) != null;
    }

    public static Edge(): boolean {
        return navigator.userAgent.toLowerCase().match(/Edge/i) != null;
    }

    public static Firefox(): boolean {
        return navigator.userAgent.match(/Firefox[/s](d+.d+)/) != null;
    }

    public static OutputBrowser(): void {
        var ua = navigator.userAgent, tem,
            M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
        if (/trident/i.test(M[1])) {
            tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
            console.log('IE ' + (tem[1] || ''));
        }
        if (M[1] === 'Chrome') {
            tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
            if (tem != null) console.log(tem.slice(1).join(' ').replace('OPR', 'Opera'));
        }
        M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
        if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]);
        console.log(M.join(' '));
    }
}

export default BrowserDetection;