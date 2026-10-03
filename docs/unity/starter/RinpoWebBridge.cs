// Copy to your SEPARATE Unity project under Assets/Scripts/RinpoWebBridge.cs.
// Assign the approved RINPO model and call these public button actions only.
using System.Runtime.InteropServices;
using UnityEngine;

public class RinpoWebBridge : MonoBehaviour
{
#if UNITY_WEBGL && !UNITY_EDITOR
    [DllImport("__Internal")]
    private static extern void RinadsPublicAction(string action);
#else
    private static void RinadsPublicAction(string action)
    {
        Debug.Log("RINPO preview action: " + action);
    }
#endif

    public void OpenRinpo() => RinadsPublicAction("OPEN_RINPO");
    public void ShowBusinessOS() => RinadsPublicAction("SHOW_BUSINESS_OS");
    public void BookDemo() => RinadsPublicAction("BOOK_DEMO");
}
