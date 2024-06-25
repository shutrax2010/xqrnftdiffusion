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
        $.ajax({
            url: '/mintnft/mint',
            type: 'POST',
            data: $('#nftform').serialize()
        }).done(function(data, textStatus, jqXHR) {
            $('#outputMsg').val(data);
            console.log('success');
        }).fail(function() {
            console.log('fail');
        });
    });
});
