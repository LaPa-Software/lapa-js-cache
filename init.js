(function() {
    'use strict';
    if(window.LaPa)return;
    var CONF = window.LaPaCONF||{};
    CONF = {
        'MODULE': {
            'core': '//lapa.ndhost.ru/lapa/core.php',
            'md5':'//lapa.ndhost.ru/lapa/md5.min.js'
        },
        'localStorage': localStorage ? true : false,
        'initTime':new Date().getTime(),
        'globalTimePoint':'init',
        'debug':'all'
    };
    var MODULE = {};
    var HOOK = {};
    var EXT = {};
    var LOG = {};
    var TIME = {};
    var NAVIGATOR = {
        'window':Object.keys(window),
        'eventHandlers':{
            'window':[],
            'document':[]
        }
    };
    window.LaPa = {};

    function regTimepoint(id,isGlobal) {
        if(id=='init'){TIME[id]=CONF.initTime}else {
            TIME[id] = new Date().getTime();
            log('time','New Time-point "'+id+'" added'+(isGlobal?' as golbal':''));
        }
        if(isGlobal)CONF.globalTimePoint=id;
    }

    function getTimestamp(relative) {
        if(!relative)relative=CONF.globalTimePoint;
        if(!TIME[relative])regTimepoint(relative);
        return new Date().getTime() - TIME[relative];
    }

    function log(channel,message,timePoint) {
        var timestamp=getTimestamp(timePoint);
        if(!LOG[channel])LOG[channel]=[];
        LOG[channel][LOG[channel].length]={'message':message,'time':timestamp,'globalTime':new Date().getTime()-CONF.initTime};
        if(!CONF.debug)return;
        if(CONF.debug=='channel'||CONF.debug=='all')console.log('T+' + timestamp + ' [' + channel + '] ' + message);
    }
    LaPa.log=log;
    log('kernel','LaPa Initialization...');

    var native_wAddEventListener = window.addEventListener;
    window.addEventListener = function (event, handler, phase, native) {
        if (event && handler) {
            if (!native) {
                if (event == 'DOMContentLoaded' || event == 'load') event = 'LaPa_onRender';
                //log('global_event','New event attached to '+event);
                NAVIGATOR.eventHandlers.window.push({'event': event, 'handler': handler, 'phase': phase});
            }
        }
        return native_wAddEventListener(event, handler, phase);
    };

    var native_dAddEventListener = document.addEventListener;
    document.addEventListener = function (event, handler, phase, native) {
        if (event && handler) {
            if (!native) {
                if (event == 'DOMContentLoaded' || event == 'load') event = 'LaPa_onRender';
                //log('global_event','New event attached to '+event);
                NAVIGATOR.eventHandlers.document.push({'event': event, 'handler': handler, 'phase': phase});
            }
        }
        return native_dAddEventListener(event, handler, phase);
    };

    function regHook(trigger, func, id) {
        if (!HOOK[trigger])HOOK[trigger] = {};
        HOOK[trigger][id || HOOK[trigger].length] = func;
    }

    function execHook(trigger) {
        log('hook_event','Triggered hook "'+trigger+'"');
        if (!HOOK[trigger])return;
        var hook_id=Object.keys(HOOK[trigger]);
        for (var i in hook_id)HOOK[trigger][hook_id[i]]();
    }

    LaPa.loadEvent = new CustomEvent("LaPa_onLoad");
    LaPa.renderEvent = new CustomEvent("LaPa_onRender");
    native_wAddEventListener('LaPa_onLoad',function(){LaPa.log('event','LaPa called event LaPa_onLoad')});
    native_wAddEventListener('LaPa_onRender',function(){LaPa.log('event','LaPa called event LaPa_onRender')});
    //native_wAddEventListener('popstate', function (e) {LaPa.page(e.state.id)}, false);

    LaPa.extension = {
        'create': function (id, initFunc, dependents) {
            if (!id || !initFunc)return false;
            if (EXT[id])return true;
            EXT[id] = {'init': initFunc, 'depends': dependents || false};
            regHook('init', initFunc, 'extension_' + id); // TODO: 1. Modules Hooking available
            /*regHook('init','extension_'+id,function () {
             if(dependents)for(i in dependents)regHook('');
             });*/
            log('extension','Created new Extension "'+id+'"');
        }
    };

    // TODO: 1. Modules Hooking available
    //for(i in Object.keys(CONF.MODULE))

    LaPa.getLog=function (channels) {
        var all_channels = !!(!channels || channels == 'all');
        if(!Array.isArray(channels)&&!all_channels)return;
        var channel = {};
        var items = [];
        for (var l in channels)channel[channels[l]] = true;
        var log_id=Object.keys(LOG);
        for (var c in log_id) {
            if (channel[log_id[c]] || all_channels) {
                for (var i in LOG[log_id[c]]) {
                    if(!items[LOG[log_id[c]][i].globalTime])items[LOG[log_id[c]][i].globalTime]=[];
                    items[LOG[log_id[c]][i].globalTime].push('T+' + (LOG[log_id[c]][i].time) + ' [' + log_id[c] + '] ' + LOG[log_id[c]][i].message);
                }
            }
        }
        for(var o in items){
            for(var j in items[o])console.log(items[o][j]);
        }
    };

    function verifyLicense() {

    }

    function loadModule(module) {
        if (MODULE[module]) {
            //return;
            log('kernel','Auto-updating module "'+module+'"');
        }else {
            log('kernel', 'Loading module "' + module + '" started');
        }
        var xhr = new XMLHttpRequest();
        xhr.open('GET', CONF.MODULE[module], true);
        xhr.send();
        xhr.onreadystatechange = function () {
            if (xhr.readyState != 4) return;
            if (xhr.status != 200) {
                log('kernel_exception','Failure of the loading module "'+module+'" with code '+xhr.status+' - '+xhr.statusText);
            } else {
                log('kernel','Loading module "'+module+'" complete');
                if (CONF.localStorage) {
                    localStorage['LaPa_' + module + '_module'] = xhr.responseText;
                    //log('kernel','Module "'+module+'" saved to LocalStorage');
                }
                MODULE[module] = {'source':xhr.responseText};
            }
        }
    }

    function init() {
        NAVIGATOR.onLoad=window.onload;
        window.onload=null;
        regTimepoint('post_init',true);
        var module_id=Object.keys(MODULE);
        for(var i in module_id){
            log('kernel','Executing module "'+module_id[i]+'"');
            //try {
                //MODULE[module_id[i]].exec = new Function(MODULE[module_id[i]].source);
                //MODULE[module_id[i]].exec=MODULE[module_id[i]].exec.bind(this);
                //MODULE[module_id[i]].exec();
                eval(MODULE[module_id[i]].source);
                log('kernel','Executing module "'+module_id[i]+'" complete');
            //}catch (e){
            //    log('kernel_exception','Module "'+module_id[i]+'" called Error state while Executing');
            //}
        }
        // TODO: 1. Modules Hooking available
        execHook('init');
        window.dispatchEvent(LaPa.renderEvent);
        NAVIGATOR.onLoad();
    }

    var module_id=Object.keys(CONF.MODULE);
    for (var i in module_id) {
        if (localStorage['LaPa_' + module_id[i] + '_module']) {
            MODULE[module_id[i]] = {'source':localStorage['LaPa_' + module_id[i] + '_module']};
        }
        loadModule(module_id[i]);
    }
    native_wAddEventListener('load', init);
    LaPa.NAVIGATOR=NAVIGATOR;
    LaPa.HOOK=HOOK;
})();