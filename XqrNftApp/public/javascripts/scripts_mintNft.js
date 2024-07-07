$(document).ready(function() {
    $('#add-property-button').click(function() {
        $('#properties-container').append(`
            <div class="property">
                <input type="text" name="propertyName" class="property-name input-area"/>
                <input type="text" name="propertyValue" class="property-value input-area"/>
                <button type="button" class="property-button remove-property">Remove</button>
            </div>
        `);
    });

    $(document).on('click', '.remove-property', function() {
        $(this).parent('.property').remove();
    });

    $('#nftform').submit(function(event) {
        event.preventDefault();
        document.getElementById('spinner').style.display = 'block';
        document.getElementById('overlay').style.display = 'block';

        $.ajax({
            url: '/mintnft/preview',
            type: 'POST',
            data: $('#nftform').serialize()
        }).done(function(data, textStatus, jqXHR) {
            $('#outputMsg').val(data);
            showPopup(data);
            console.log('success');
        }).fail(function() {
            console.log('fail');
        }).always(function() {
            document.getElementById('spinner').style.display = 'none';
            document.getElementById('overlay').style.display = 'none';
        });
    });

    function showPopup(qrUrl){
        $('#qrImage').attr('src', qrUrl);
        document.getElementById('popup-wrapper').style.display = 'block';
    }

    $(document).on('click', '.popup-okBtn', function(){
        document.getElementById('spinner').style.display = 'block';
        document.getElementById('overlay').style.display = 'block';

        $.ajax({
            url: '/minnft/mint',
            type: 'POST',
        }).done(function(data, textStatus, jqXHR) {
            $('#outputMsg').val(data);
            console.log('success');
        }).fail(function() {
            console.log('fail');
        }).always(function() {
            document.getElementById('spinner').style.display = 'none';
            document.getElementById('overlay').style.display = 'none';
        });
    });

    $(document).on('click', '.popup-cancelBtn', function(){
        document.getElementById('popup-wrapper').style.display = 'none';
    })
});
