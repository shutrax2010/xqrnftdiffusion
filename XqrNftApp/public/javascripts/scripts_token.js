$(document).ready(function() {
    document.getElementById('resultMsg').style.display = 'none';

    //trustline
    $(document).on('click','#setTrustlineBtn', function(event){
        event.preventDefault();

        $.ajax({
            url: '/token/setTrustline',
            type: 'POST'
        }).done(function(data, textStatus, jqXHR) {
            console.log(data);
            window.open(data.url, '_blank', 'width=700,height=600');
            // console.log('trustline OK');
        });
    });
});