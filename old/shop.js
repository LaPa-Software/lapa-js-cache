LaPa.createExtension('shop','Shop Listener',paidListener);
function paidListener(){
    query=LaPa.pageQuery;
    if(query.inv_id){
        data=[];
        data['id']=query.inv_id;
        LaPa.io(paidComplete,'checkPaid.php',data,'checkPaid',true);
    }
}
function paidComplete(response,meta){
    try{
        response=JSON.parse(response);
        if(response.status=='ok'){
            alert('Заказ успешно проведен');
        }else if(response.status=='abort') {
            alert('Заказ отменен');
        }else{
            alert('Заказ не обнаружен');
        }
    }catch (e){
        alert('Ошибка проверки заказа');
    }
}