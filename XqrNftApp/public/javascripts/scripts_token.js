$(document).ready(function() {
    document.getElementById('resultMsg').style.display = 'none';

    //trustline
    $(document).on('click','#setTrustlineBtn', function(event){
        event.preventDefault();
        document.getElementById('resultMsg').style.display = 'none';

        $.ajax({
            url: '/token/setTrustline',
            type: 'POST',
            success: function(payloadData) {
                const signUrl = payloadData.next.always;
                const payloadUuid = payloadData.uuid;

                if(signUrl){
                    const signWindow = window.open(signUrl, '_blank', 'width=700,height=600');

                    const intercalId = setInterval(async () => {
                        try {
                            const response = await fetch(`/token/payload/${payloadUuid}`);
                            const payloadStatus = await response.json();
                            console.log(response);

                            if(payloadStatus.status === 'completed' && payloadStatus.resolved) {
                                clearInterval(intercalId);

                                if(signWindow){
                                    signWindow.close();
                                }

                                $('#resultMsg label').text('Trustline set successfully!');
                                $('#resultMsg').show();
                            }
                        } catch (error) {
                            console.error('Error fetching payload status:', error);
                        }
                    }, 5000);
                } else {
                    console.error('Xumm payload missing "next.always" property');
                }
            },
            error: function(error) {
                console.error('Error: ',error);
            }
        })
    });

    $(document).on('click','#claimTokensBtn', function(event){
        event.preventDefault();
        document.getElementById('resultMsg').style.display = 'none';

        $.ajax({
            url: '/token/claim',
            type: 'POST',
            success: function(data){
                console.log(data);
                if(data.result === 'success'){
                    $('#resultMsg label').text('You got 10 PQR tokens!');
                    $('#resultMsg').show();
                }else{
                    $('#resultMsg label').text('Sorry, Error occured...');
                    $('#resultMsg').show();
                }
            },
            error: function(error){
                console.error('Error: ', error);
            }
        })
    });
});