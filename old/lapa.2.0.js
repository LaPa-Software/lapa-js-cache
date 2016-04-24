var LaPa= {
    'version': 20,
    'loadBegin': new Date().getTime(),
    'debug': true,
    'PAGE': {},
    'JS': {},
    'CSS': {},
    'CONF': {
        'title': false
    },
    'STACK': {},
    'currentPage': location.pathname == '/' ? '/index.html' : location.pathname,
    'log': function (text) {
        if (LaPa['debug']) {
            time = new Date().getTime() - LaPa.loadBegin;
            console.log('[' + time + '] ' + text);
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
    'send':function(url,params,callback) {
        var xmlhttp;
        if (window.XMLHttpRequest) {
            xmlhttp = new XMLHttpRequest();
        } else {
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState == 4) {
                response=false;
                if (xmlhttp.status == 200) {
                    response=xmlhttp.responseText
                }
                callback(response);
            }
        };
        params=params?params+'&':'';
        xmlhttp.open('GET', url + '?'+params+'rand=' + new Date().getTime(), true);
        xmlhttp.send();
    },
    'load':function(url,callback,id) {
        var xmlhttp;
        if (window.XMLHttpRequest) {
            xmlhttp = new XMLHttpRequest();
        } else {
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState == 4) {
                response=false;
                if (xmlhttp.status == 200) {
                    response=xmlhttp.responseText
                }
                callback(id?id:response,id?response:null);
            }
        };
        xmlhttp.open('GET', url + '?rand=' + new Date().getTime(), true);
        xmlhttp.send();
    },
    'parseHTML': function (source) {
        source=source.replace('<!DOCTYPE html>','');
        source=HTMLtoDOM(source);
        return source;
    },
    'scriptLoad': function (id,source) {
        if(source){
            LaPa.JS[id]=source;
            LaPa.saveDB('JS');
        }
    },
    'parseScripts':function(id,body){
        LaPa.log('[PAGE] Parsing scripts...');
        if(!body){
            body=LaPa.parseHTML(LaPa.PAGE[id]['body']);
        }
        scripts=body.getElementsByTagName('script');
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
        LaPa.log('[PAGE] found '+listScripts.length+' scripts');
        return body;
    },
    'cachePage': function () {
        LaPa.log('[PAGE] caching content...');
        LaPa.PAGE[LaPa.currentPage]['title']=document.title;
        LaPa.PAGE[LaPa.currentPage]['body']=LaPa.parseScripts(LaPa.currentPage).innerHTML;
        LaPa.saveDB('PAGE');
        LaPa['loadComplete']=true;
        //window.dispatchEvent(LaPa.loadEvent);
        LaPa.log('[PAGE] Load complete');
    },
    'modifyLinks': function (id,body) { //TODO: Auto Pre-load
        LaPa.log('[PAGE] Links modifying...');
        if(body) {
            links = body.getElementsByTagName('a');
        } else {
            links = document.getElementsByTagName('a');
        }
        listLinks=[];
        for (i in links) {
            if (links[i].host == location.host) {
                links[i].pathname = links[i].pathname == '/' ? '/index.html' : links[i].pathname;
                type=links[i].pathname.split('.');
                type=type[type.length-1];
                if(type=='html'||type=='php') {
                    if (links[i].pathname == LaPa.currentPage) {
                        // inPage navigation
                    } else {
                        if (links[i].onclick == null) {
                            links[i].onclick = function(){LaPa.page(links[i].pathname)};//'LaPa.page("' + links[i].pathname + '")';
                            links[i].setAttribute('onclick','LaPa.page("' + links[i].pathname + '")');
                            LaPa.log('[LINK] ' + links[i].pathname + ' fetched');
                            listLinks[listLinks.length]=links[i].pathname;
                            links[i].href = 'javascript:void(0)';
                        }
                    }
                }
            } // outgoing link
        }
        LaPa.PAGE[id]['links']=listLinks;
        if(body){
            return LaPa.parseScripts(id,body);
        }else {

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
    'page':function(id,source){
        if(LaPa.loadComplete){
            LaPa.loadBegin=new Date().getTime();
        }
        if(source==false){
            alert('Страница не доступна');
            LaPa.log('[PAGE] error while opening page!');
            return false;
        }else {
            if (source) {
                LaPa.log('[PAGE] saving content to cache...');
                LaPa.PAGE[id]={};
                content = LaPa.parseHTML(source);
                title = content.getElementsByTagName('title')[0].innerHTML;//LaPa.CONF.title;
                scripts = content.getElementsByTagName('script');
                body = LaPa.modifyLinks(id,content.getElementsByTagName('body')[0]).innerHTML;
                LaPa.PAGE[id]['title']=title;
                LaPa.PAGE[id]['body']=body;
                LaPa.saveDB('PAGE');
                delete content;
            }
        }
        if (LaPa.PAGE[id]) {
            LaPa.log('[PAGE] rendering content from cache...');
            LaPa.currentPage = id;
            page = LaPa.PAGE[id];
            document.title = page['title'];
            document.body.innerHTML = page['body'];// LaPa.modifyLinks(id,page['body']);
            window.dispatchEvent(LaPa.loadEvent);
            LaPa['loadComplete']=true;
            LaPa.log('[PAGE] Load complete');
        }else{
            LaPa.log('[PAGE] load '+id);
            LaPa.load('http://'+location.host+id,LaPa.page,id);
        }
    },
    'init': function () {
        LaPa.log('[BROWSER] DOM Ready');
        if (LaPa['LocalStorage'] && LaPa['cache']) {
            //TODO: Unpacking from Cache
            //LaPa.bodyReady(LaPa.page)
            //LaPa['loadComplete']=true;
            //LaPa.log('[PAGE] Load complete');
        }
        //TODO: add path from get headers
    },
    'postInit': function () {
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
        LaPa.PAGE[LaPa.currentPage]={};
            LaPa.bodyReady(LaPa.modifyLinks,LaPa.currentPage);
            //window.dispatchEvent(LaPa.loadEvent);
        //}
    }
};
if(localStorage){
    LaPa['LocalStorage']=true;
    LaPa.log('[LocalStorage] Available');
    if(localStorage['LaPa']==undefined||localStorage['LaPa']<LaPa.version){
        localStorage.clear();
        localStorage['LaPa']=LaPa.version;
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
LaPa.loadEvent = new CustomEvent("lapa_load");
window.addEventListener('DOMContentLoaded',LaPa.init());
window.addEventListener('load',LaPa.postInit());