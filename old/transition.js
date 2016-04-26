function initTransitions() {
    LaPa.startTrans=function () {
        document.body.style.filter="url('/js/blur.svg#blur')";
    };
    LaPa.endTrans=function () {
        document.body.style.filter="";
    };
    window.native_addEventListener('LaPaLoad',LaPa.startTrans);
    window.native_addEventListener('LaPaRender',LaPa.endTrans);
}
createExtension('transition','Transition animation',initTransitions,{'major':0,'minor':1,'build':2});