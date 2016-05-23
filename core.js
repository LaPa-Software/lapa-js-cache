"use strict";
LaPa.version={'major':3,'minor':0};
log('kernel','LaPa v.' + LaPa.version.major + '.' + LaPa.version.minor+' loaded');

function io(callback, url, params, key, meta, queue) {
    key = key || url;
    if (!params)params = '';
    if (typeof params != 'string') {
        var paramsLine = '';
        var params_id = Object.keys(params);
        for (var i in params_id) {
            paramsLine += params_id[i] + '=' + params[params_id[i]] + '&';
        }
        params = paramsLine;
    }
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url + '?' + params + 'lapa=true&rand=' + new Date().getTime(), true);
    xhr.send();
    xhr.onreadystatechange = function () {
        if (xhr.readyState != 4) return;
        if (xhr.status != 200) {
            //log('kernel_exception','Failure of the loading module "'+module+'" with code '+xhr.status+' - '+xhr.statusText);
        } else {
            //log('kernel','Loading module "'+module+'" complete');
            callback(xhr.responseText);
        }
    }
}

function page(id) {
    
}

LaPa.io=io;