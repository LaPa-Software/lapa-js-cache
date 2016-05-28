if(!window.LaPa) {
    window.LaPa = {
        'version': {'major': 2, 'minor': 9, 'build': 628},
        'loadBegin': new Date().getTime(),
        'debug': true,
        'extensions': {},
        'PAGE': {},
        'JS': {},
        'CSS': {}, // TODO: USE IT!!! MAKE FUCKED CSS SUB-SYSTEM NOW!!!!!!! TRUTH, IT VERY-VERY IMPORTANT!!!!
        'CONF': {'runScriptsAsFuncContainer': true, 'legacyPages': true, 'experementalIndicator':true},
        'STACK': {},
        'log': function (text, group, hideTime) { // Debug output to Browser console
            if (LaPa['debug']) {
                time = new Date().getTime() - LaPa.loadBegin;
                console.log((hideTime ? '' : '[' + time + '] ') + (group ? '[' + group + '] ' : '') + text);
            }
        },
        'rand': function (length) {
            length = length ? length : 8;
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

            for (var i = 0; i < length; i++)
                text += possible.charAt(Math.floor(Math.random() * possible.length));

            return text;
        },
        'errorHandler': function (errorMsg, url, lineNumber, column, errorObj) {
            if (!LaPa.errorLog)LaPa.errorLog = [];
            if (LaPa.errorLog[errorMsg]) {
                LaPa.errorLog[errorMsg].count++;
            } else {
                LaPa.errorLog[errorMsg] = {
                    'message': errorMsg,
                    'source': url,
                    'lineNumber': lineNumber,
                    'column': column,
                    'errorObj': errorObj,
                    'count': 0
                };
            }
            // TODO: Collect exception to Developer
            if (!LaPa.CONF.hideErrors) {
                if (LaPa.oldErrorHandler) {
                    //LaPa.oldErrorHandler(errorMsg, url, lineNumber, column, errorObj); // Support for preConfigured errorHandler
                }
                //return false;
            }
            return true;
        },
        'pageQuery': function () {
            var match,
                pl = /\+/g,
                search = /([^&=]+)=?([^&]*)/g,
                decode = function (s) {
                    return decodeURIComponent(s.replace(pl, " "));
                },
                query = window.location.search.substring(1);

            params = {};
            while (match = search.exec(query)) {
                params[decode(match[1])] = decode(match[2]);
            }
            return params;
        }(),
        'createExtension': function (id, name, init, version) { // Registration for Extension
            if (!id) return false;
            if (LaPa.extensions[id]) return true;
            LaPa.extensions[id] = {};
            if (name) LaPa.extensions[id]['name'] = name;
            if (init) LaPa.extensions[id]['init'] = init;
            if (version) LaPa.extensions[id]['version'] = version;
            LaPa.log((name ? name : id) + ' registered', 'EXTENSION');
            if (LaPa.extensionsInitialised) return LaPa.loadExt(id);
            return true;
        },
        'loadExt': function (id) { // Initialise Extensions
            if (id) {
                ext = LaPa.extensions[id];
                if (ext.init) {
                    result = ext.init();
                }
                LaPa.log((ext.name ? ext.name : i) + (ext.version ? (' v.' + ext.version.major + '.' + ext.version.minor + ' build ' + ext.version.build) : '') + ' initialised', 'EXTENSION');
                return result || true;
            } else {
                LaPa.extensionsInitialised = true;
                for (i in LaPa.extensions) {
                    ext = LaPa.extensions[i];
                    if (ext.init) {
                        ext.init()
                    }
                    LaPa.log((ext.name ? ext.name : i) + (ext.version ? (' v.' + ext.version.major + '.' + ext.version.minor + ' build ' + ext.version.build) : '') + ' initialised', 'EXTENSION');
                }
            }
        },
        'history': function (e) { // History API Listener
            if (e.state) {
                //id = typeof e.state == 'object' ? e.state.id : e.state;
                id = e.state.id;
                LaPa.log('located to ' + id, 'HISTORY', true);
                if (id == LaPa.currentPage) {
                    history.back();
                } else {
                    //LaPa.log('[History] located to ' + id, true);
                    LaPa.page(id);
                }
            }
        },
        'fixJSforDB': function () {
            jsList = Object.keys(LaPa.JS);
            exportJS = {};
            for (i in jsList) {
                exportJS[jsList[i]] = {'body': LaPa.JS[jsList[i]].body,'init':LaPa.JS[jsList[i]].init,'block_unload':LaPa.JS[jsList[i]].block_unload};
            }
            return exportJS;
        },
        'saveDB': function (part) { // Saving data to LocalStorage
            if (part) {
                data = LaPa[part];
                if (part == 'JS')data = LaPa.fixJSforDB();
                localStorage[part] = JSON.stringify(data);
                LaPa.log('Saved ' + part, 'LocalStorage');
            } else {
                localStorage['CONF'] = JSON.stringify(LaPa['CONF']);
                localStorage['JS'] = JSON.stringify(LaPa.fixJSforDB());
                localStorage['CSS'] = JSON.stringify(LaPa['CSS']);
                localStorage['PAGE'] = JSON.stringify(LaPa['PAGE']);
                LaPa.log('Saved fully', 'LocalStorage');
            }
        },
        'syncDB': function (part) {
            if(localStorage[part]){
                fromDB=JSON.parse(localStorage[part]);
                for(key in fromDB){
                    LaPa[part][key]=fromDB[key];
                }
            }
        },
        'io': function (callback, url, params, key, meta, queue) {
            key = key ? key : url;
            if (LaPa.STACK[key] && !LaPa.STACK[key].queue && LaPa.STACK[key].delay == false) {
                LaPa.log(key + ' duplicated call, already loading...', 'STACK');
                return;
            }
            if (!LaPa.STACK[key]) {
                if (!callback || !url) {
                    LaPa.log('Callback or Url not presented, abort...', 'STACK');
                    return;
                }
                LaPa.STACK[key] = {
                    'callback': callback ? callback : '',
                    'url': url,
                    'params': params,
                    'delay': false,
                    'meta': meta ? meta : false,
                    'queue': queue ? queue : false
                };
                LaPa.log('Created item ' + key, 'STACK');
                if (queue && Object.keys(LaPa.STACK).length > 0) { // TODO : Check for all exist items are in queue
                    LaPa.log('is full loaded, searching available thread...', 'STACK');
                    for (i in LaPa.STACK)if (!LaPa.STACK[i].queue) {
                        LaPa.log('Thread used by ' + i, 'STACK');
                        return;
                    }
                    ;
                    LaPa.log('Found empty Thread, continued...', 'STACK');
                }
            }
            LaPa.STACK[key].delay = new Date().getTime();
            LaPa.log(key + ' sending request...', 'STACK');
            if (LaPa.STACK[key].params) {
                if (typeof LaPa.STACK[key].params != 'string') {
                    paramsLine = '';
                    for (i in LaPa.STACK[key].params) {
                        paramsLine += i + '=' + LaPa.STACK[key].params[i] + '&';
                    }
                    LaPa.STACK[key].paramsObj = LaPa.STACK[key].params;
                    LaPa.STACK[key].params = paramsLine;
                }
            } else {
                LaPa.STACK[key].params = '';
            }
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
                    LaPa.stackComplete(response, key);
                }
            };
            xmlhttp.open('GET', LaPa.STACK[key].url + '?' + LaPa.STACK[key].params + 'lapa=true&rand=' + new Date().getTime(), true);
            xmlhttp.send();
        },
        'stackComplete': function (response, key) {
            if (!LaPa.STACK[key])return;
            LaPa.STACK[key].delay = new Date().getTime() - LaPa.STACK[key].delay;
            status = response ? 'Complete' : 'Failure';
            callback = LaPa.STACK[key].callback;
            LaPa.log(key + ' ' + (key == LaPa.STACK[key].url ? '' : '(URL: ' + LaPa.STACK[key].url + ') ') + status + ' at ' + LaPa.STACK[key].delay + 'ms', 'LOAD');
            meta = null;
            if (LaPa.STACK[key].meta) {
                delete LaPa.STACK[key].meta;
                meta = LaPa.STACK[key];
                meta.key = key;
            }
            delete LaPa.STACK[key];
            callback(response, meta);
            if (Object.keys(LaPa.STACK).length > 0) {
                for (i in LaPa.STACK) {
                    if (LaPa.STACK[i].queue) {
                        LaPa.log(i + ' ejected from queue', 'STACK');
                        LaPa.io(null, null, null, i, null, false);
                        break;
                    }
                }
            }
        },
        'script': {
            'clearTimers': function () {
                count = 0;
                if (window.timerHandlers) {
                    for (i in timerHandlers) {
                        if (clearTimeout(timerHandlers[i])) count++;
                    }
                    timerHandlers = [];
                } else {
                    var currentID = setTimeout(function () {
                    }, 1);
                    for (var id = currentID; id > 0; id--) if (clearTimeout(id)) count++;
                }
                LaPa.log(count + ' Timeouts cleared', 'Navigator')
            },
            'clearIntervals': function () {
                count = 0;
                if (window.intervalHandlers) {
                    for (i in intervalHandlers) {
                        if (clearInterval(intervalHandlers[i])) count++;
                    }
                    intervalHandlers = [];
                } else {
                    var currentID = setInterval(function () {
                    }, 1);
                    for (var id = currentID; id > 0; id--) if (clearInterval(id)) count++;
                }
                LaPa.log(count + ' Intervals cleared', 'Navigator')
            },
            'clearVars': function () {
                if (!LaPa.script.globalVarsList) return;
                currentVarsList = Object.keys(window);
                count = 0;
                for (i in currentVarsList) {
                    if (currentVarsList[i] == 'LaPa') continue;
                    if (currentVarsList[i] == 'count') continue;
                    if (currentVarsList[i] == 'currentVarsList') continue;
                    if (currentVarsList[i] == 'globalVarsList') continue;
                    if (currentVarsList[i] == 'page') continue;
                    if (currentVarsList[i] == 'md5') continue;
                    if (!LaPa.script.globalVarsList[i]) {
                        delete window[currentVarsList[i]];
                        count++;
                    }
                }
                LaPa.log(count + ' Variables zeroized', 'Navigator');
            },
            'clearHandlers': function () {
                for (i in eventHandlers) {
                    listner = eventHandlers[i];
                    window.removeEventListener(listner.event, listner.handler, listner.phase);
                }
                LaPa.log(eventHandlers.length + ' listners removed', 'Navigator');
                eventHandlers = [];
            },
            'clearWindow': function () {
                LaPa.script.clearHandlers();
                LaPa.script.clearIntervals();
                LaPa.script.clearTimers();
                LaPa.script.clearVars();
            },
            'removeFuncContainer': function (id) {
                if (LaPa.JS[id].func&&!LaPa.JS[id].block_unload) {
                    delete LaPa.JS[id].func;
                }
            },
            'funcContainer': function (id) {
                if (!LaPa.JS[id].block_unload||!LaPa.JS[id].func) {
                    try {
                        LaPa.JS[id].func = new Function(LaPa.JS[id].body);
                        LaPa.JS[id].func();
                    } catch (e) {
                        LaPa.log('Error while executing ' + id + '', 'SCRIPT')
                    }
                }
                if (LaPa.JS[id].init){
                    try {
                        eval(LaPa.JS[id].init);
                    }catch (e){
                        LaPa.log('Error while triggering ' + id + '', 'SCRIPT')
                    }
                }
            }
        },
        'runScript': function (id) {
            if (!LaPa.scriptsQueue[id]) return;
            try {
                if (LaPa.CONF.runScriptsAsFuncContainer) {
                    LaPa.script.funcContainer(id);
                } else {
                    scriptNode = document.createElement('script');
                    scriptNode.id = id;
                    scriptNode.defer = true;
                    scriptNode.text = LaPa.JS[id].body;
                    document.head.appendChild(scriptNode);
                }
                LaPa.log(id + ' Ready', 'SCRIPT');
            } catch (e) {
                LaPa.log(id + ' called Error: ' + (e.message ? (e.message + ' on line ' + e.lineNumber + ':' + e.columnNumber + ' in ' + e.stack) : e), 'SCRIPT');
            }
            LaPa.JS[id].loaded = true;
            delete LaPa.scriptsQueue[id];
            if (LaPa.scriptsQueue.length == 0) LaPa.buildPage();
        },
        'loadScript': function (source, meta) {
            if (!source) return; // TODO: Error loading Script Case;
            LaPa.log(meta.key + ' Loaded', 'SCRIPT');
            if (!LaPa.JS[meta.key]) LaPa.JS[meta.key] = JSON.parse(localStorage.JS)[meta.key]||{};
            LaPa.JS[meta.key].body = source;
            LaPa.JS[meta.key].loaded = LaPa.JS[meta.key].loaded ? LaPa.JS[meta.key].loaded : false;
            LaPa.saveDB('JS');
            cpath = document.createElement('a');
            cpath.href = meta.key;
            link = cpath.href.split(cpath.host);
            LaPa.io(LaPa.loadAdapter, 'http://lapa.ndhost.ru/gate.php', {'script_adaptation': encodeURIComponent(link[1])}, meta.key, true);
            delete cpath;
        },
        'loadAdapter': function (source, meta) {
            if (LaPa.JS[meta.key].preparingRun) LaPa.runScript(meta.key);
            if (!source) return; // TODO: Error loading Script Case;
            try {source=JSON.parse(source);}catch (e){return;}
            LaPa.log('Adaptation for ' + meta.key + ' loaded', 'SCRIPT');
            if (!LaPa.JS[meta.key]) return;
            LaPa.JS[meta.key].init = source.init||false;
            LaPa.JS[meta.key].block_unload = source.block_unload||false;
            LaPa.saveDB('JS');
        },
        'unloadScript': function (id) {
            if (LaPa.CONF.runScriptsAsFuncContainer) {
                LaPa.script.removeFuncContainer(id);
            } else {
                scriptNode = document.getElementById(id);
                scriptNode.parentNode.removeChild(scriptNode);
            }
            LaPa.JS[id].loaded = false;
            LaPa.log(id + ' unLoaded', 'SCRIPT');
        },
        'loadScripts': function (listScripts) {
            list = [];
            LaPa.scriptsQueue = [];
            for (i in LaPa.JS) {
                if (listScripts[i]) {
                    list[i] = true;
                    if (LaPa.JS[i].loaded) continue;
                    LaPa.scriptsQueue[i] = true;
                    if (LaPa.JS[i].body) {
                        LaPa.runScript(i);
                    } else {
                        LaPa.JS[i].preparingRun = true;
                        LaPa.log(i + ' Downloading...', 'SCRIPT');
                        LaPa.io(LaPa.loadScript, i, null, i, true);
                    }
                } else {
                    if (LaPa.JS[i].loaded) LaPa.unloadScript(i);
                }
            }
            for (i in listScripts) {
                if (list[i]) continue;
                if (!LaPa.JS[i]) LaPa.JS[i] = {};
                LaPa.scriptsQueue[i] = true;
                LaPa.JS[i].preparingRun = true;
                LaPa.log(i + ' Downloading...', 'SCRIPT');
                LaPa.io(LaPa.loadScript, i, null, i, true);
            }
            if (LaPa.scriptsQueue.length == 0) LaPa.buildPage();
            delete list;
        },
        'makeIndicator': function (state) {
            if (LaPa.indicator) {
                document.body.appendChild(LaPa.indicator);
            } else {
                LaPa.log('Building LaPa Indicator...', 'PAGE');
                if(LaPa.CONF.experementalIndicator){
                    LaPa.indicator = document.createElement('div');
                    LaPa.indicator.id = 'indicator';
                    LaPa.indicator.style.position = 'fixed';
                    LaPa.indicator.style.zIndex='2206';
                    LaPa.indicator.style.bottom = '10px';
                    LaPa.indicator.style.right = '10px';
                    LaPa.indicator.style.opacity = '0.3';
                    LaPa.indicator.style.cursor = 'pointer';
                    LaPa.indicator.style.userSelect = 'none';
                    LaPa.indicator.style.mozUserSelect = 'none';
                    LaPa.indicator.style.webkitUserSelect = 'none';
                    LaPa.indicator.style.msUserSelect = 'none';
                    LaPa.indicator.style.transition = 'opacity 0.5s ease-in-out';
                    //LaPa.indicator.style.borderRadius = '10px';
                    //LaPa.indicator.style.backgroundColor = 'rgb(174, 138, 225)';
                    LaPa.indicator.onclick = function () {
                        //showBanner();
                    };
                    LaPa.indicator.onmouseover = function () {
                        this.style.opacity = '1';
                    };
                    LaPa.indicator.onmouseout = function () {
                        this.style.opacity = '0.3';
                    };
                    LaPa.indicator.innerHTML = '<img width="50" height="50" src="//lapa.ndhost.ru/lapa/banner.svg">' +
                        '<div id="indicator_loader" style="visibility: hidden;position: absolute;top:0px;left: 0px;">' +
                        '<svg version="1.1" id="loader-1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="50px" height="50px" viewBox="0 0 50 50" style="enable-background:new 0 0 50 50;" xml:space="preserve"><path fill="#aaa" d="M25.251,6.461c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615V6.461z"><animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.4s" repeatCount="indefinite"/></path></svg>' +
                        '</div>';
                    LaPa.indicator.title='Ускорено технологией LaPa Software';
                    document.body.appendChild(LaPa.indicator);
                }else {
                    //LaPa.indiStyle="<style>.loader {visibility: visible}</style>";
                    LaPa.indicator = document.createElement('div');
                    LaPa.indicator.id = 'indicator';
                    LaPa.indicator.style.position = 'fixed';
                    LaPa.indicator.style.opacity = '0.3';
                    LaPa.indicator.style.bottom = '40px';
                    LaPa.indicator.style.right = '0px';
                    LaPa.indicator.style.width = '50px';
                    LaPa.indicator.style.maxHeight = '50px';
                    LaPa.indicator.style['backdrop-filter'] = 'blur(5px)';
                    LaPa.indicator.style.cursor = 'pointer';
                    LaPa.indicator.style.userSelect = 'none';
                    LaPa.indicator.style.mozUserSelect = 'none';
                    LaPa.indicator.style.webkitUserSelect = 'none';
                    LaPa.indicator.style.msUserSelect = 'none';
                    LaPa.indicator.style.transition = 'opacity 0.5s ease-in-out';
                    LaPa.indicator.onmouseover = function () {
                        this.style.opacity = '1';
                    };
                    LaPa.indicator.onmouseout = function () {
                        this.style.opacity = '0.3';
                    };
                    LaPa.indicator.onclick = function () {
                        if (confirm('Ускорено технологией LaPa Software, нажмите ОК чтобы узнать как ускорить ваш сайт.')) {
                            //location.href = 'http://lapa.ndhost.ru';
                            window.open('http://lapa.ndhost.ru', '_blank');
                        }
                    };
                    LaPa.indicator.innerHTML = '<div id="indicator_loader" style="visibility: hidden;">' +
                        '<svg version="1.1" id="loader-1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="40px" height="40px" viewBox="0 0 50 50" style="enable-background:new 0 0 50 50;" xml:space="preserve"><path fill="#aaa" d="M25.251,6.461c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615V6.461z"><animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.6s" repeatCount="indefinite"/></path></svg>' +
                        '</div><span style="position: absolute;left:12px;top: 7px;padding-right: 10px">🐾</span>';
                    document.body.appendChild(LaPa.indicator);
                }
            }
            if (state)LaPa.indicatorState(state);
        },
        'indicatorState': function (state) {
            if (!document.getElementById('indicator')) {
                LaPa.makeIndicator(state);
                return
            }
            if (state == 'loading' || state == true)document.getElementById('indicator_loader').style.visibility = 'visible';
            if (state == 'ready' || state == false)document.getElementById('indicator_loader').style.visibility = 'hidden';
        },
        'preLoadPage': function (links) {
            link = Object.keys(links);
            for (i in link) {
                if (LaPa.PAGE[link[i]]) continue;
                LaPa.log(link[i] + ' Sending to preload...', 'PAGE');
                LaPa.io(LaPa.loadPage, link[i], null, link[i], true, true);
            }
        },
        'check': function (response) {
            if (response) {
                response = response == location ? location.host : response;
                LaPa.CONF['domain'] = response;
                //LaPa.saveDB('CONF');
            }
            if (LaPa.CONF['domain']) {
                if (LaPa.CONF['domain'] != location.host) {
                    LaPa.log('LaPa is Not Licensed, self-killing...');
                    LaPa.indicatorState('ready');
                    //delete window.LaPa;
                    return false;
                }
            } else {
                LaPa.io(LaPa.check, 'http://lapa.ndhost.ru/domain.php', {
                    'url': location.host,
                    'ver': JSON.stringify(LaPa.version)
                }, 'check');
            }
            return true;
        },
        'parseHTML': {
            'modifyLinks': function (source, dom) {
                if (dom) {
                    container = dom;
                } else {
                    container = document.createElement('div');
                    container.innerHTML = source;
                }
                link = container.getElementsByTagName('a');
                links = {};
                LaPa.log('Fetching Links...', 'PARSING');
                if (location.pathname.indexOf('wp-admin') < 0) {
                    for (i in link) {
                        if ((link[i].host == location.host) && (link[i].protocol == location.protocol)) {
                            if (!link[i].onclick) {
                                ext = link[i].pathname.split('/');
                                if (ext[1] == 'wp-admin')continue;
                                if (ext[1] == 'wp-login.php')continue;
                                if (ext[ext.length - 1].indexOf('.') != -1) {
                                    ext = ext[ext.length - 1].split('.');
                                    ext = ext[ext.length - 1];
                                } else {
                                    ext = 'html';
                                }
                                if (ext == 'html' || ext == 'htm' || ext == 'php') {
                                    links[link[i].pathname] = {'href': link[i].pathname, 'state': 'fetched'};
                                    container.getElementsByTagName('a')[i].setAttribute('onclick', "LaPa.page(this.pathname);return false;");
                                    LaPa.log(link[i].pathname + ' Fetched!', 'LINK');
                                }
                            }
                        }
                        //if(Object.keys(links).length>10)break;
                    }
                }
                if (dom) {
                    source = container;
                } else {
                    source = container.innerHTML;
                }
                LaPa.log(Object.keys(links).length + ' links found', 'PARSING');
                return {'source': source, 'links': links};
            },
            'getScripts': function (source, clean, noGlobal, allLoaded) {
                noGlobal = noGlobal ? noGlobal : false;
                scripts = {};
                LaPa.log('Fetching Scripts...', 'PARSING');
                while (source.search('<script') > -1) {
                    // Script(s) found
                    script = {};
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
                        if (script['scriptSrc'].indexOf(location.host) == -1 && script['scriptSrc'].indexOf('http') == -1)
                            if (script['scriptSrc'][0] != '/') script['scriptSrc'] = '/' + script['scriptSrc'];
                    } else {
                        // Script not linked
                    }
                    // TODO: Global registration and Preloading Scripts with Checking Exists
                    id = script['scriptSrc'] ? script['scriptSrc'] : 'script_' + md5(script['scriptBody']);
                    if ((id.indexOf('lapa.js') != -1) || (id.indexOf('lapa.pre.js') != -1)) {
                        LaPa.log(id + ' excluded!', 'SCRIPT');
                    } else {
                        scripts[id] = true;
                        if (noGlobal) {
                            scripts[id] = script['scriptBody'] == '' ? false : script['scriptBody'];
                        } else {
                            if (!LaPa.JS[id]) LaPa.JS[id] = {'body': script['scriptBody'] == '' ? false : script['scriptBody']};
                            if (allLoaded) LaPa.JS[id].loaded = true;
                            if (script['scriptSrc'] && LaPa.JS[id].body == false) {
                                chost = document.createElement('a');
                                chost.href = script['scriptSrc'];
                                if (chost.host != location.host) {
                                    LaPa.io(LaPa.loadScript, 'http://lapa.ndhost.ru/gate.php', {'script_url': encodeURIComponent(chost.href)}, script['scriptSrc'], true);
                                } else {
                                    LaPa.io(LaPa.loadScript, script['scriptSrc'], null, script['scriptSrc'], true);
                                }
                                //LaPa.io(LaPa.loadAdapter, 'http://lapa.ndhost.ru/gate.php', {'script_adaptation': encodeURIComponent(chost.pathname)}, script['scriptSrc'], true);
                                delete chost;
                            }
                        }
                        LaPa.log(id + ' Fetched', 'SCRIPT');
                    }
                    source = source.substring(0, script['scriptTagStart']) + source.substring(script['scriptTagEnd'] + '</script>'.length);
                    delete script;
                }
                LaPa.log((Object.keys(scripts).length) + ' scripts found', 'PARSING');
                if (clean) {
                    return {'source': source, 'scripts': scripts};
                }
                return scripts;
            },
            'preparePage': function (page) {
                LaPa.log('Fetching Body, Head and Title...', 'PARSING');
                page = page.replace('<!DOCTYPE html>', '');
                headTagStart = page.search('<head>') + '<head>'.length;
                headTagEnd = page.search('</head>');
                bodyTagStart = page.search('<body') + '<body'.length;
                bodyTagStart = page.substring(bodyTagStart).search('>') + bodyTagStart + '>'.length;
                bodyTagEnd = page.search('</body>');
                headTag = page.substring(headTagStart, headTagEnd);
                bodyTag = page.substring(bodyTagStart, bodyTagEnd);
                titleTagStart = headTag.search('<title>');
                titleTagEnd = headTag.search('</title>');
                titleTag = headTag.substring(titleTagStart + '<title>'.length, titleTagEnd);
                LaPa.log('Page ' + titleTag + ' Fetched', 'PARSING');
                return {'title': titleTag, 'head': headTag, 'body': bodyTag};
            },
            'init': function (source, thisPage) {
                if (thisPage) {
                    /*page = {
                     'title': document.title,
                     'head': document.head.innerHTML,
                     //'body': document.body.innerHTML,
                     'headScripts': LaPa.parseHTML.getScripts(document.head.innerHTML, null, null, true)
                     };*/
                    body = LaPa.parseHTML.modifyLinks(null, document.body);
                    return;
                    //page.links=body.links;
                    //page.body=body.source.innerHTML;
                    // TODO: Links pre-loader
                } else {
                    page = LaPa.parseHTML.preparePage(source);
                    page.headScripts = LaPa.parseHTML.getScripts(page.head);
                    body = LaPa.parseHTML.modifyLinks(page.body);
                    page.links = body.links;
                    page.body = body.source;
                }
                body = LaPa.parseHTML.getScripts(page.body, true);
                page.bodyScripts = body.scripts;
                page.body = body.source;
                LaPa.log('Complete', 'PARSING');
                return page; // TODO: Remove Head content
            }
        },
        'readyPage': function (url) {
            /*if(LaPa.waitList.length!=0){
             for (i in LaPa.waitList){
             LaPa.log(i+' load unFinished!','SCRIPT');
             delete LaPa.STACK[i];
             }
             }*/
            //if(LaPa.preparingPage) {
            //    LaPa.preparingPage = false;
            LaPa.indicatorState('ready');
            LaPa.log('initPage loaded', 'PAGE');
            /*try {
             LaPa.allowRunEvents=true;
             window.dispatchEvent(LaPa.renderEvent);
             }catch(e){

             }*/
            //}
        },
        'fetchPage': function () {
            LaPa.indicatorState('loading');
            LaPa.currentPage = location.pathname;
            history.replaceState({'id': LaPa.currentPage}, document.title, LaPa.currentPage);
            LaPa.initComplete = true;
            LaPa.skipPrepairing = false;
            LaPa.preparingPage = LaPa.currentPage;
            LaPa.waitList = [];
            if (LaPa.PAGE[LaPa.currentPage]) {
                LaPa.log(LaPa.currentPage + ' is initPage, already cached', 'PAGE');
                //LaPa.PAGE[LaPa.currentPage] = LaPa.parseHTML.init(null, true);
                LaPa.parseHTML.init(null, true);
                //LaPa.saveDB('PAGE');
                //LaPa.preLoadPage(LaPa.PAGE[LaPa.currentPage].links);
                for (i = 0; i < document.getElementsByTagName('script').length; i++) {
                    id = document.getElementsByTagName('script')[i].src.split(location.host)[1];
                    if (LaPa.JS[id]) {
                        document.getElementsByTagName('script')[i].id = id;
                    }
                }
                //setTimeout(LaPa.readyPage,500);
                //LaPa.readyPage();
            } else {
                LaPa.log(LaPa.currentPage + ' is initPage, caching...', 'PAGE');
                //LaPa.PAGE[LaPa.currentPage] = LaPa.parseHTML.init(null, true);
                LaPa.parseHTML.init(null, true);
                //LaPa.saveDB('PAGE');
                //LaPa.preLoadPage(LaPa.PAGE[LaPa.currentPage].links);
                for (i = 0; i < document.getElementsByTagName('script').length; i++) {
                    id = document.getElementsByTagName('script')[i].src.split(location.host)[1];
                    if (LaPa.JS[id]) {
                        LaPa.waitList[id] = true;
                        document.getElementsByTagName('script')[i].id = id;
                        /*document.getElementsByTagName('script')[i].onload = function () {
                         if(LaPa.fetchTimeOut)clearTimeout(LaPa.fetchTimeOut);
                         delete LaPa.waitList[id];
                         if (LaPa.waitList.length == 0){LaPa.readyPage();}else{
                         LaPa.fetchTimeOut=setTimeout(LaPa.readyPage, 200);
                         }
                         };*/
                    }
                }
                //LaPa.fetchTimeOut=setTimeout(LaPa.readyPage, 200); // TODO: Check already loaded scripts
                //LaPa.readyPage();
                //LaPa.preparingPage=false;
                LaPa.skipPrepairing = true;
                LaPa.getPage(LaPa.currentPage);
            }
            ;
            LaPa.indicatorState('ready');
            LaPa.allowRunEvents = true;
            window.dispatchEvent(LaPa.renderEvent);
        },
        'loadPage': function (source, meta) {
            if (!source) return;
            LaPa.log(meta.url + ' Loaded', 'PAGE');
            page = LaPa.parseHTML.init(source);
            LaPa.PAGE[meta.url] = page;
            LaPa.saveDB('PAGE');
            if (LaPa.preparingPage == meta.url) {
                if (LaPa.skipPrepairing) {
                    LaPa.preLoadPage(LaPa.PAGE[LaPa.preparingPage].links);
                } else {
                    LaPa.render(meta.url);
                }
            }
        },
        'getPage': function (url) {
            LaPa.log(url + ' Loading...', 'PAGE');
            LaPa.io(LaPa.loadPage, url, null, url, true);
        },
        'buildPage': function () {
            if (!LaPa.preparingPage) {
                //LaPa.preLoadPage(LaPa.PAGE[LaPa.currentPage].links);
                return;
            }
            //if(!LaPa.preparingPage)return;
            LaPa.currentPage = LaPa.preparingPage || LaPa.currentPage;
            LaPa.preparingPage = false;
            page = LaPa.PAGE[LaPa.currentPage];
            history.pushState({'id': LaPa.currentPage}, LaPa.PAGE[LaPa.currentPage]['title'], LaPa.currentPage);
            document.title = page.title;
            document.body.innerHTML = page.body;
            if (window.scrollTo) {
                window.scrollTo(0, 0);
            } else {
                document.body.scrollTop = 0;
                document.body.scrollLeft = 0;
            }
            LaPa.indicatorState('loading');
            LaPa.log('Markup ready, building Body Scripts...', 'PAGE');
            for (i in page.bodyScripts) {
                try {
                    if (LaPa.CONF.runScriptsAsFuncContainer) {
                        LaPa.script.funcContainer(i);
                    } else {
                        scriptNode = document.createElement('script');
                        scriptNode.id = i;
                        scriptNode.defer = 'defer';
                        scriptNode.text = LaPa.JS[i].body;
                        document.body.appendChild(scriptNode);
                    }
                    LaPa.log(i + ' Ready', 'SCRIPT');
                } catch (e) {
                    LaPa.log(i + ' called Error: ' + (e.message ? (e.message + ' on line ' + e.lineNumber + ':' + e.columnNumber + ' in ' + e.stack) : e), 'SCRIPT');
                }
            }
            LaPa.indicatorState('ready');
            LaPa.log(LaPa.currentPage + ' Load Complete', 'PAGE');
            try {
                window.dispatchEvent(LaPa.renderEvent);
            } catch (e) {

            }
        },
        'render': function (url) {
            if (LaPa.preparingPage == url) {
                if (LaPa.CONF.runScriptsAsFuncContainer && LaPa.CONF.legacyPages) {
                    LaPa.script.clearWindow()
                } else {
                    for (i in LaPa.PAGE[LaPa.currentPage].headScripts) {
                        if (!LaPa.PAGE[url].headScripts[i]) {
                            LaPa.log('Found unused ' + i + ', Destroying Page...', 'SCRIPT')
                            LaPa.script.clearWindow();
                            break;
                        }
                    }
                }
            }
            LaPa.log('Rendering...', 'PAGE');
            LaPa.loadScripts(LaPa.PAGE[url].headScripts);
            LaPa.preLoadPage(LaPa.PAGE[url].links);
        },
        'page': function (url) {
            if (LaPa.check() == false) {
                location.href = url;
                return;
            }
            if (LaPa.currentPage == url) return;
            if (LaPa.initComplete) LaPa.loadBegin = new Date().getTime();
            LaPa.log(url + ' Preparing...', 'PAGE');
            LaPa.indicatorState('loading');
            try {
                LaPa.allowRunEvents = false;
                window.dispatchEvent(LaPa.loadEvent);
            } catch (e) {

            }
            LaPa.preparingPage = url;
            LaPa.skipPrepairing = false;
            if (LaPa.PAGE[url]) {
                LaPa.render(url);
            } else {
                LaPa.getPage(url);
            }
        },
        'init': function () {
            //LaPa.oldErrorHandler = window.onerror;
            //window.onerror = LaPa.errorHandler;
            LaPa.loadExt();
            try {
                LaPa.allowRunEvents = false;
                window.dispatchEvent(LaPa.loadEvent);
            } catch (e) {

            }
        },
        'onReadyBody': function (callback) {
            LaPa.readyBody = setInterval(function () {
                if (document.body) {
                    clearInterval(LaPa.readyBody);
                    delete LaPa.readyBody;
                    LaPa.log('Ready', 'BODY');
                    callback();
                }
            }, 50);
        }
    };
    LaPa.log('LaPa v.' + LaPa.version.major + '.' + LaPa.version.minor + ' build ' + LaPa.version.build);
    if (localStorage) {
        LaPa['LocalStorage'] = true;
        LaPa.log('Available', 'LocalStorage');
        if (localStorage['LaPa'] == undefined || localStorage['LaPa'] < ((LaPa.version.major * 10) + LaPa.version.minor)) {
            localStorage['LaPa'] = ((LaPa.version.major * 10) + LaPa.version.minor);
            localStorage.removeItem('CONF');
            localStorage.removeItem('JS');
            localStorage.removeItem('CSS');
            localStorage.removeItem('PAGE');
            LaPa.log('by Older version, cleared', 'LocalStorage');
        }
        if (localStorage['CONF']) {
            //LaPa.CONF = LaPa.CONF.concat(JSON.parse(localStorage['CONF']));
            LaPa.syncDB('CONF');
            LaPa.PAGE = localStorage['PAGE'] ? JSON.parse(localStorage['PAGE']) : {};
            LaPa.JS = localStorage['JS'] ? JSON.parse(localStorage['JS']) : {};
            LaPa.CSS = localStorage['CSS'] ? JSON.parse(localStorage['CSS']) : {};
            LaPa['cache'] = true;
            LaPa.log('Cache found, loaded', 'LocalStorage');
            LaPa.saveDB('CONF');
        } else {
            LaPa.saveDB('CONF');
            LaPa['cache'] = false;
            LaPa.log('Cache not found, generated', 'LocalStorage');
        }
    } else {
        LaPa['LocalStorage'] = false;
        LaPa.log('Unavailable', 'LocalStorage');
    }
    if (!LaPa.CONF['domain']) {
        LaPa.io(LaPa.check, 'http://lapa.ndhost.ru/domain.php', {
            'url': location.host,
            'ver': JSON.stringify(LaPa.version)
        }, 'check');
    }
    if (!window.native_addEventListener) native_addEventListener = addEventListener;
    if (!window.native_setInterval) native_setInterval = setInterval;
    if (!window.native_setTimeout) native_setTimeout = setTimeout;
    if (!window.eventHandlers)eventHandlers = [];
    if (!window.intervalHandlers)intervalHandlers = [];
    if (!window.timerHandlers)timerHandlers = [];
    if (window.createExtension) {
        window.createExtension = LaPa.createExtension;
        if (window.extensions)LaPa.extensions = window.extensions;
        delete window.extensions;
    }
    LaPa.loadEvent = new CustomEvent("LaPaLoad");
    LaPa.renderEvent = new CustomEvent("LaPaRender");
    window.native_addEventListener('LaPaLoad', function () {
        LaPa.log('LaPa called event LaPaLoad', 'Navigator')
    });
    window.native_addEventListener('LaPaRender', function () {
        LaPa.log('LaPa called event LaPaRender', 'Navigator')
    });
    window.native_addEventListener('DOMContentLoaded', LaPa.init());
    window.native_addEventListener('load', LaPa.onReadyBody(LaPa.fetchPage));
    window.native_addEventListener('popstate', LaPa.history, false);
    LaPa.script.globalVarsList = window.globalVarsList ? globalVarsList : Object.keys(window);
    window.addEventListener("keydown", function (event) {
        switch (event.keyCode) {
            case 116 : // 'F5'
                localStorage.removeItem('LAPASOURCE');
                localStorage.removeItem('LaPa');
                localStorage.removeItem('CONF');
                localStorage.removeItem('JS');
                localStorage.removeItem('PAGE');
                LaPa.log('Cache cleared','Navigator',true);
                break;
        }
    });
}