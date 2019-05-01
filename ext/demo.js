(function () {
    function initDemo() {
        alert('Demo executed!');
    }

    LaPa.extension.create('Demo', initDemo, ['core']);
})();