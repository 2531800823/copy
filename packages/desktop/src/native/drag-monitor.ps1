$source = @'
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

public static class DragDropMonitor
{
    private const uint EVENT_OBJECT_CREATE = 0x8000;
    private const uint EVENT_OBJECT_DESTROY = 0x8001;
    private const uint WINEVENT_OUTOFCONTEXT = 0x0000;
    private const uint WINEVENT_SKIPOWNPROCESS = 0x0002;

    private delegate void WinEventDelegate(
        IntPtr hWinEventHook,
        uint eventType,
        IntPtr hwnd,
        int idObject,
        int idChild,
        uint dwEventThread,
        uint dwmsEventTime
    );

    [StructLayout(LayoutKind.Sequential)]
    private struct POINT
    {
        public int x;
        public int y;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct MSG
    {
        public IntPtr hwnd;
        public uint message;
        public UIntPtr wParam;
        public IntPtr lParam;
        public uint time;
        public POINT pt;
    }

    [DllImport("user32.dll")]
    private static extern IntPtr SetWinEventHook(
        uint eventMin,
        uint eventMax,
        IntPtr hmodWinEventProc,
        WinEventDelegate lpfnWinEventProc,
        uint idProcess,
        uint idThread,
        uint dwFlags
    );

    [DllImport("user32.dll")]
    private static extern bool UnhookWinEvent(IntPtr hWinEventHook);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll")]
    private static extern bool IsWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern sbyte GetMessage(out MSG lpMsg, IntPtr hWnd, uint wMsgFilterMin, uint wMsgFilterMax);

    [DllImport("user32.dll")]
    private static extern bool TranslateMessage([In] ref MSG lpMsg);

    [DllImport("user32.dll")]
    private static extern IntPtr DispatchMessage([In] ref MSG lpMsg);

    private static WinEventDelegate callback = HandleWinEvent;
    private static IntPtr createHook = IntPtr.Zero;
    private static IntPtr destroyHook = IntPtr.Zero;
    private static IntPtr activeDragWindow = IntPtr.Zero;
    private static Timer dragWatchTimer = null;

    public static void Start()
    {
        createHook = SetWinEventHook(
            EVENT_OBJECT_CREATE,
            EVENT_OBJECT_CREATE,
            IntPtr.Zero,
            callback,
            0,
            0,
            WINEVENT_OUTOFCONTEXT | WINEVENT_SKIPOWNPROCESS
        );

        destroyHook = SetWinEventHook(
            EVENT_OBJECT_DESTROY,
            EVENT_OBJECT_DESTROY,
            IntPtr.Zero,
            callback,
            0,
            0,
            WINEVENT_OUTOFCONTEXT | WINEVENT_SKIPOWNPROCESS
        );

        if (createHook == IntPtr.Zero || destroyHook == IntPtr.Zero)
        {
            Console.Error.WriteLine("Failed to register drag-drop monitor.");
            return;
        }

        Console.WriteLine("{\"type\":\"ready\"}");
        Console.Out.Flush();
    }

    public static void Stop()
    {
        StopWatchTimer();

        if (createHook != IntPtr.Zero)
        {
            UnhookWinEvent(createHook);
            createHook = IntPtr.Zero;
        }

        if (destroyHook != IntPtr.Zero)
        {
            UnhookWinEvent(destroyHook);
            destroyHook = IntPtr.Zero;
        }

        activeDragWindow = IntPtr.Zero;
    }

    private static void HandleWinEvent(
        IntPtr hWinEventHook,
        uint eventType,
        IntPtr hwnd,
        int idObject,
        int idChild,
        uint dwEventThread,
        uint dwmsEventTime
    )
    {
        if (!IsSysDragImage(hwnd))
        {
            return;
        }

        if (eventType == EVENT_OBJECT_CREATE)
        {
            activeDragWindow = hwnd;
            StartWatchTimer();
            Emit("dragstart");
            return;
        }

        if (eventType == EVENT_OBJECT_DESTROY && hwnd == activeDragWindow)
        {
            activeDragWindow = IntPtr.Zero;
            StopWatchTimer();
            Emit("dragend");
        }
    }

    private static bool IsSysDragImage(IntPtr hwnd)
    {
        if (hwnd == IntPtr.Zero)
        {
            return false;
        }

        var className = new StringBuilder(256);
        return GetClassName(hwnd, className, className.Capacity) > 0
            && className.ToString() == "SysDragImage";
    }

    private static void StartWatchTimer()
    {
        StopWatchTimer();
        dragWatchTimer = new Timer(
            _ =>
            {
                if (activeDragWindow == IntPtr.Zero)
                {
                    return;
                }

                if (!IsWindow(activeDragWindow))
                {
                    activeDragWindow = IntPtr.Zero;
                    StopWatchTimer();
                    Emit("dragend");
                }
            },
            null,
            200,
            200
        );
    }

    private static void StopWatchTimer()
    {
        if (dragWatchTimer == null)
        {
            return;
        }

        dragWatchTimer.Dispose();
        dragWatchTimer = null;
    }

    private static void Emit(string type)
    {
        Console.WriteLine("{\"type\":\"" + type + "\"}");
        Console.Out.Flush();
    }

    public static void RunMessageLoop()
    {
        MSG msg;
        while (GetMessage(out msg, IntPtr.Zero, 0, 0) > 0)
        {
            TranslateMessage(ref msg);
            DispatchMessage(ref msg);
        }
    }
}
'@

Add-Type -TypeDefinition $source
[DragDropMonitor]::Start()

try {
    [DragDropMonitor]::RunMessageLoop()
}
finally {
    [DragDropMonitor]::Stop()
}
