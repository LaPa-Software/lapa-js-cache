var LaPa= {
    'version': {'major': 2, 'minor': 6, 'build': 351},
    'loadBegin': new Date().getTime(),
    'debug': true,
    'extensions': [],
    'PAGE': {},
    'JS': {},
    'CSS': {},
    'CONF': {
        'title': false
    },
    'STACK': {},
    'currentPage': location.pathname,
    'log': function (text, hideTime) {
        if (LaPa['debug']) {
            time = new Date().getTime() - LaPa.loadBegin;
            console.log((hideTime ? '' : '[' + time + '] ') + text);
        }
    },
    'errorHandler': function (errorMsg, url, lineNumber, column, errorObj) {
        // TODO: Collect exception to Developer
        if (LaPa.oldErrorHandler) {
            return LaPa.oldErrorHandler(errorMsg, url, lineNumber, column, errorObj);
        }
        return false;
    },
    'extension': function (id, name, init, version) {
        LaPa.extensions[id] = {};
        if (name) {
            LaPa.extensions[id]['name'] = name;
        }
        if (init) {
            LaPa.extensions[id]['init'] = init;
        }
        if (version) {
            LaPa.extensions[id]['version'] = version;
        }
        if (LaPa.extensionsInitialised) {
            LaPa.loadExt(id);
        }
    },
    'loadExt': function (id) {
        if (id) {
            ext = LaPa.extensions[id];
            if (ext.init) {
                ext.init()
            }
            LaPa.log('[Module] ' + (ext.name ? ext.name : i) + (ext.version ? (' v.' + ext.version.major + '.' + ext.version.minor + ' build ' + ext.version.build) : ''));
        } else {
            LaPa.extensionsInitialised = true;
            for (i in LaPa.extensions) {
                ext = LaPa.extensions[i];
                if (ext.init) {
                    ext.init()
                }
                LaPa.log('[Module] ' + (ext.name ? ext.name : i) + (ext.version ? (' v.' + ext.version.major + '.' + ext.version.minor + ' build ' + ext.version.build) : ''));
            }
        }
    },
    'history': function (e) {
        if (e.state) {
            //id = typeof e.state == 'object' ? e.state.id : e.state;
            id = e.state.id;
            LaPa.log('[History] located to ' + id, true);
            if (id != LaPa.currentPage) {
                //LaPa.log('[History] located to ' + id, true);
                LaPa.page(id);
            }
        }
    },
    'saveDB': function (part) {
        if (part) {
            localStorage[part] = JSON.stringify(LaPa[part]);
            LaPa.log('[LocalStorage] Saved ' + part);
        } else {
            localStorage['CONF'] = JSON.stringify(LaPa['CONF']);
            localStorage['JS'] = JSON.stringify(LaPa['JS']);
            localStorage['CSS'] = JSON.stringify(LaPa['CSS']);
            localStorage['PAGE'] = JSON.stringify(LaPa['PAGE']);
            LaPa.log('[LocalStorage] Saved fully');
        }
    },
    'send': function (url, params, callback) {
        var xmlhttp;
        if (window.XMLHttpRequest) {
            xmlhttp = new XMLHttpRequest();
        } else {
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState == 4) {
                response = false;
                if (xmlhttp.status == 200) {
                    response = xmlhttp.responseText
                }
                callback(response);
            }
        };
        params = params ? params + '&' : '';
        xmlhttp.open('GET', url + '?' + params + 'lapa=true&rand=' + new Date().getTime(), true);
        xmlhttp.send();
    },
    'load': function (url, callback, id) {
        var xmlhttp;
        if (window.XMLHttpRequest) {
            xmlhttp = new XMLHttpRequest();
        } else {
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState == 4) {
                response = false;
                if (xmlhttp.status == 200) {
                    response = xmlhttp.responseText
                }
                callback(id ? id : response, id ? response : null);
            }
        };
        xmlhttp.open('GET', url + '?lapa=true&rand=' + new Date().getTime(), true);
        xmlhttp.send();
    },
    'rand': function (length) {
        length=length?length:8;
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for( var i=0; i < length; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    },
    'parseHTML': function (source, id, dom) {
        dom=dom?dom:false;
        id = id ? id : LaPa.currentPage;
        source = source.replace('<!DOCTYPE html>', '');
        scripts = [];
        while (source.search('<script') > -1) {
            // Script(s) found
            script={};
            script['scriptTagStart'] = source.search('<script');
            script['scriptTagEnd'] = source.search('</script>');
            script['scriptTag'] = source.substring(script['scriptTagStart'], script['scriptTagEnd']);
            script['scriptHeadEnd'] = script['scriptTag'].search('>');
            script['scriptHead'] = script['scriptTag'].substring('<script'.length, script['scriptHeadEnd']);
            script['scriptBody'] = script['scriptTag'].substring(script['scriptHeadEnd'] + '>'.length);
            if ((script['scriptHead'].search('src') > -1) && script['scriptBody'].length == 0) {
                script['scriptSrc'] = script['scriptHead'].substring(script['scriptHead'].search('src'));
                script['scriptSrc'] = script['scriptSrc'].substring(script['scriptHead'].search('"') - 1);
                script['scriptSrc'] = script['scriptSrc'].substring(0, script['scriptSrc'].search('"'));
            } else {
                // Script not linked
            }
            scripts[script['scriptSrc'] ? script['scriptSrc'] : LaPa.rand()] = {'body': script['scriptBody']==''?false:script['scriptBody']};
            source = source.substring(0, script['scriptTagStart']) + source.substring(script['scriptTagEnd'] + '</script>'.length);
            delete script;
        }
        LaPa.PAGE[id]['scripts'] = scripts;
        if(dom) {
            source = HTMLtoDOM(source);
        }
        return source;
    },
    'scriptLoad': function (id, source) {
        if (source) {
            LaPa.JS[id] = source;
            LaPa.saveDB('JS');
        }
    },
    'parseScripts': function (id, body) {
        LaPa.log('[PAGE] Parsing scripts...');
        if (!body) {
            body = LaPa.parseHTML(LaPa.PAGE[id]['body'], id);
        }
        /*scripts=body.getElementsByTagName('script');
         listScripts=[];
         for(i in scripts){
         LaPa.log('SCRIPT url: '+scripts[i].src);
         if(scripts[i].src!=''){
         link=scripts[i].src.split('/');
         if(link[0]=='http:'){
         if(location.host==link[2]) {
         delete link[0];
         delete link[1];
         delete link[2];
         }
         }
         link='/'+link.join('/');
         if(LaPa.JS[link]){
         // Ok
         }else{
         LaPa.log('[SCRIPT] load '+link);
         LaPa.load('http://'+location.host+link,LaPa.scriptLoad,link);
         }
         listScripts[listScripts.length]=link;
         //scripts[i].parentNode.removeChild(scripts[i]);
         //LaPa.log('[SCRIPT] removed '+link);
         }else{
         // in-page scripts
         }
         }
         LaPa.PAGE[id]['scripts']=listScripts;
         LaPa.log('[PAGE] found '+listScripts.length+' scripts');*/
        return body;
    },
    'cachePage': function (id) {
        LaPa.log('[PAGE] caching content...');
        LaPa.PAGE[LaPa.currentPage]['title'] = document.title;
        LaPa.PAGE[LaPa.currentPage]['body'] = document.body.innerHTML//LaPa.parseScripts(LaPa.currentPage).innerHTML;
        LaPa.saveDB('PAGE');
        LaPa['loadComplete'] = true;
        window.dispatchEvent(LaPa.renderEvent);
        //history.pushState(id,page['title'],id);
        LaPa.log('[PAGE] Load complete');
    },
    'modifyLinks': function (id, body) { //TODO: Auto Pre-load
        if (!LaPa.PAGE[id]['links']) {
            LaPa.log('[PAGE] Links modifying...');
            dir = id.split('/');
            dir = dir.length == 1 ? '' : dir[0];
            if (body) {
                links = body.getElementsByTagName('a');
            } else {
                links = document.getElementsByTagName('a');
            }
            listLinks = [];
            for (i in links) {
                if (links[i].host == location.host) {
                    if (links[i].pathname == LaPa.currentPage) {
                        // inPage navigation
                    } else {
                        type = links[i].pathname.split('.');
                        type = type.length > 1 ? type[type.length - 1] : 'html';
                        if (type == 'html' || type == 'php') {
                            if (links[i].onclick == null) {
                                links[i].onclick = function () {
                                    LaPa.page(dir + links[i].pathname)
                                };//'LaPa.page("' + links[i].pathname + '")';
                                links[i].setAttribute('onclick', 'LaPa.page("' + dir + links[i].pathname + '")');
                                LaPa.log('[LINK] ' + links[i].pathname + ' fetched');
                                listLinks[listLinks.length] = links[i].pathname;
                                links[i].href = 'javascript:void(0)';
                            }
                        }
                    }
                } // outgoing link
            }
            LaPa.PAGE[id]['links'] = listLinks;
        }
        if (body) {
            return body;//LaPa.parseScripts(id,body);
        } else {
            LaPa.cachePage(id);
        }
    },
    'bodyReady': function (callback, param) {
        if (document.body) {
            LaPa.log('[PAGE] Body is accessible');
            callback(param ? param : null);
        } else {
            setTimeout(function () {
                LaPa.bodyReady(callback, param ? param : null)
            }, 10);
        }
    },
    'page': function (id, source) {
        if (LaPa.disabled) {
            return;
        }
        if (LaPa.loadComplete) {
            LaPa.loadBegin = new Date().getTime();
        }
        if (source == false) {
            alert('Страница не доступна');
            LaPa.log('[PAGE] error while opening page!');
            window.dispatchEvent(LaPa.renderEvent);
            return false;
        } else {
            if (source) {
                LaPa.log('[PAGE] saving content to cache...');
                LaPa.PAGE[id] = {};
                //try{
                content = LaPa.parseHTML(source, id, true);
                /*}catch(e){
                 LaPa.log('[PAGE] error while parsing page!');
                 alert('Ошибка при разборе страницы');
                 window.dispatchEvent(LaPa.renderEvent);
                 return false;
                 }*/
                title = content.getElementsByTagName('title')[0].innerHTML;//LaPa.CONF.title;
                //scripts = content.getElementsByTagName('script');
                body = LaPa.modifyLinks(id, content.getElementsByTagName('body')[0]).innerHTML;
                LaPa.PAGE[id]['title'] = title || document.title;
                LaPa.PAGE[id]['body'] = body;
                LaPa.saveDB('PAGE');
                delete content;
            }
        }
        if (LaPa.PAGE[id]) {
            LaPa.log('[PAGE] ' + id + ' rendering content from cache...');
            page = LaPa.PAGE[id];
            document.title = page['title'];
            document.body.innerHTML = page['body'];// LaPa.modifyLinks(id,page['body']);
            if (LaPa.currentPage == id) {
                history.replaceState({'id': id}, page['title'], id);
            } else {
                history.pushState({'id': id}, page['title'], id);
            }
            LaPa.currentPage = id;
            //window.dispatchEvent(LaPa.renderEvent);
            //LaPa['loadComplete']=true;
            //LaPa.log('[PAGE] Load complete');
            LaPa.modifyLinks(id);
        } else {
            LaPa.log('[PAGE] load ' + id);
            window.dispatchEvent(LaPa.loadEvent);
            LaPa.load('http://' + location.host + id, LaPa.page, id);
        }
    },
    'init': function () {
        if (LaPa.disabled) {
            return;
        }
        LaPa.log('[BROWSER] DOM Ready');
        LaPa.loadExt();
        window.dispatchEvent(LaPa.loadEvent);
        if (LaPa['LocalStorage'] && LaPa['cache']) {
            //TODO: Unpacking from Cache
            //LaPa.bodyReady(LaPa.page)
            //LaPa['loadComplete']=true;
            //LaPa.log('[PAGE] Load complete');
        }
        //TODO: add path from get headers
    },
    'postInit': function () {
        if (LaPa.disabled) {
            return;
        }
        LaPa.log('[BROWSER] Content Ready');
        /* if (LaPa['cache'] || LaPa.PAGE[LaPa.currentPage]) {
         //TODO: Set timer for loading
         setTimeout(function () {
         if (LaPa['loadComplete'] == undefined) {
         LaPa.log('[INITIALIZATION TIMEOUT] Alert');
         if (confirm('Загрузка выполняеться дольше обычного... Попробовать загрузить все с начала?')) {
         LaPa.log('[LocalStorage] Cache cleared, and [Window] reloading...');
         localStorage.clear();
         location.reload();
         } else {
         LaPa.log('[INITIALIZATION TIMEOUT] Aborted, continue...');
         }
         }
         }, 10000);
         } else {*/
        LaPa.oldErrorHandler = window.onerror;
        window.onerror = LaPa.errorHandler;
        LaPa.PAGE[LaPa.currentPage] = {};
        history.replaceState({'id': LaPa.currentPage}, document.title, LaPa.currentPage);
        LaPa.bodyReady(LaPa.modifyLinks, LaPa.currentPage);

        //}
    }
};
LaPa.log('LaPa v.'+LaPa.version.major+'.'+LaPa.version.minor+' build '+LaPa.version.build);
if(localStorage){
    LaPa['LocalStorage']=true;
    LaPa.log('[LocalStorage] Available');
    if(localStorage['LaPa']==undefined||localStorage['LaPa']<((LaPa.version.major*10)+LaPa.version.minor)){
        localStorage.clear();
        localStorage['LaPa']=((LaPa.version.major*10)+LaPa.version.minor);
        LaPa.log('[LocalStorage] by Older version, cleared');
    }
    if(localStorage['CONF']){
        LaPa.CONF=JSON.parse(localStorage['CONF']);
        LaPa.PAGE=localStorage['PAGE']?JSON.parse(localStorage['PAGE']):{};
        LaPa.JS=localStorage['JS']?JSON.parse(localStorage['JS']):{};
        LaPa.CSS=localStorage['CSS']?JSON.parse(localStorage['CSS']):{};
        LaPa['cache']=true;
        LaPa.log('[LocalStorage] Cache found, loaded');
    }else{
        LaPa.saveDB('CONF');
        LaPa['cache']=false;
        LaPa.log('[LocalStorage] Cache not found, generated');
    }
}else{
    LaPa['LocalStorage']=false;
    LaPa.log('[LocalStorage] Unavailable');
}
LaPa.loadEvent = new CustomEvent("LaPaLoad");
LaPa.renderEvent = new CustomEvent("LaPaRender");
window.addEventListener('DOMContentLoaded',LaPa.init());
window.addEventListener('load',LaPa.postInit());
window.addEventListener('popstate',LaPa.history, false);