xhr = new XMLHttpRequest();

xhr.open('GET', 'http://LaPaCore.projects.ponomarevlad.ru/old/lapa.2.6.js', true);

xhr.send();

xhr.onreadystatechange = function() {
    if (xhr.readyState != 4) return;
    if (xhr.status != 200) {
        alert(xhr.status + ': ' + xhr.statusText);
    } else {
        eval(xhr.responseText);
    }
};