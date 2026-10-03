// Copy to your SEPARATE Unity project under Assets/Plugins/RinpoWebBridge.jslib.
// Never send session tokens, tenant data, or arbitrary customer prompts to Unity.
// ES5 syntax for Unity's JavaScript plugin compiler.
mergeInto(LibraryManager.library, {
  RinadsPublicAction: function (actionPtr) {
    var action = UTF8ToString(actionPtr);
    if (action !== "OPEN_RINPO" &&
        action !== "SHOW_BUSINESS_OS" &&
        action !== "BOOK_DEMO") return;
    window.dispatchEvent(new CustomEvent("rinads:unity:action", {
      detail: { action: action }
    }));
  }
});
