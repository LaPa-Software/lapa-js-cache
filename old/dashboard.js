if(!LaPa.dashboard){
    LaPa.dashboard={
        'version':{'major':1,'minor':0,'build':1},
        'property':{},
        'openDomain':function(domain){

        },
        'showConsole':function (waitForLoad) {
            if(waitForLoad){
                LaPa.indicatorState(true);
                document.getElementById('dashboard').innerHTML='<div>Получение данных...</div>';
                return;
            }
            if(LaPa.dashboard.domains){
                listDomains='';
                domains=Object.keys(LaPa.dashboard.domains);
                for(i in domains){
                    listDomains+='<br><a href="'+domains[i]+'" onclick="LaPa.dashboard.openDomain(this.href);return false;">'+domains[i]+'</a> ';
                    listDomains+='<br>ID заказа: '+LaPa.dashboard.domains[domains[i]].id+' ('+(LaPa.dashboard.domains[domains[i]].status?'Оплачено':'Ожидает оплаты')+')';
                    listDomains+='<br>Состояние плагина: '+(LaPa.dashboard.domains[domains[i]].work=='normal'?('Активен ('+LaPa.dashboard.domains[domains[i]].version+')'):'Не обнаружен или поврежден')+'<br>';
                }
                listDomains=listDomains==''?'Не найдены':listDomains;
            }
            document.getElementById('dashboard').innerHTML='<div><h4>Список оплаченных доменов:</h4>'+listDomains+'</div><br><div id="pay">Зарегистрировать ваш сайт<br><input type="text" id="domain" placeholder="Адрес вашего сайта без http://"><br><input type="text" id="code" placeholder="Если у вас есть Бонус-код"><br>На следующем этапе будет необходимо нажать на кнопку оплаты<br><button onclick="LaPa.dashboard.sendPay();">Продолжить</button><br><br><button onclick="LaPa.dashboard.logOut();">Выход из кабинета</button></button></div>';
        },
        'showAuth':function(){
            document.getElementById('dashboard').innerHTML='<div><input type="email" id="login" placeholder="Адрес E-mail"><br><input type="password" id="pass" placeholder="Пароль"><br><button onclick="LaPa.dashboard.auth();">Вход</button></div>';
            if(localStorage['dashboard']){
                saved=JSON.parse(localStorage['dashboard']);
                document.getElementById('login').value=saved.login;
                document.getElementById('pass').value=saved.pass;
            }
        },
        'getDomains':function(){
            LaPa.indicatorState(true);
            LaPa.io(LaPa.dashboard.handler,'/api.php',{'q':JSON.stringify({'action':'domains'})},'dashboardDomains');
        },
        'handler':function(response){
            LaPa.indicatorState(false);
            try{
                response=JSON.parse(response);
            }catch (e){
                alert('Ошибка разбора ответа от сервера');
                return;
            }
            if(response.auth){
                LaPa.dashboard.account=response.auth;
                if(response.domains){
                    LaPa.dashboard.domains=response.domains;
                    LaPa.dashboard.showConsole();
                }else{
                    LaPa.dashboard.showConsole(true);
                    LaPa.dashboard.getDomains();
                }
            }else{
                if(response.uid){
                    if(LaPa.dashboard.account) {
                        if (LaPa.dashboard.account.id == response.uid) {
                            if (response.domains) {
                                LaPa.dashboard.domains = response.domains;
                                LaPa.dashboard.showConsole();
                            }
                            if (response.pay) {
                                response.pay='<a id="autoClick" href="'+response.pay+'" rel="noreferrer">Продолжить</a>';
                                //location.replace(response.pay);
                                document.getElementById('pay').innerHTML = response.pay + '<br><button onclick="LaPa.dashboard.showConsole();">Отмена</button>';
                                document.getElementById('autoClick').click();
                            }
                        }
                    }else{
                        LaPa.dashboard.showConsole(true);
                        LaPa.dashboard.account={'id':response.uid};
                        LaPa.dashboard.getDomains();
                    }
                }else{
                    delete LaPa.dashboard.account;
                    delete LaPa.dashboard.domains;
                    LaPa.dashboard.showAuth();
                }
            }
            if(response.message)alert(response.message);
        },
        'auth':function(){
            LaPa.indicatorState(true);
            login=document.getElementById('login').value;
            pass=document.getElementById('pass').value;
            localStorage.setItem('dashboard',JSON.stringify({'login':login,'pass':pass}));
            LaPa.io(LaPa.dashboard.handler,'/api.php',{'q':JSON.stringify({'action':'auth','login':login,'pass':(window.md5?md5(pass):pass)})},'dashboardAuth');
        },
        'sendPay':function(){
            LaPa.indicatorState(true);
            LaPa.io(LaPa.dashboard.handler,'/api.php',{'q':JSON.stringify({'action':'pay','domain':document.getElementById('domain').value,'code':document.getElementById('code').value})},'dashboardPay');
        },
        'logOut':function () {
            LaPa.indicatorState(true);
            LaPa.io(LaPa.dashboard.handler,'/api.php',{'q':JSON.stringify({'action':'logout'})},'dashboardPay');
        },
        'init':function () {
            if(LaPa.dashboard.account){
                if(LaPa.dashboard.domains) {
                    LaPa.dashboard.showConsole();
                }else{
                    LaPa.dashboard.showConsole(true);
                    LaPa.dashboard.getDomains();
                }
            }else{
                LaPa.dashboard.showAuth();
                LaPa.indicatorState(true);
                LaPa.io(LaPa.dashboard.handler,'/api.php',null,'dashboardStatus');
            }
        }
    };
    createExtension('dashboard','DashBoard',LaPa.dashboard.init,LaPa.dashboard.version);
}else{
    LaPa.dashboard.init();
}