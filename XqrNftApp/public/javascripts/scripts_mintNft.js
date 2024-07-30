$(document).ready(function () {
    $('#add-property-button').click(function () {
        $('#properties-container').append(`
            <div class="property">
                <input type="text" name="propertyName" class="property-name input-area"/>
                <input type="text" name="propertyValue" class="property-value input-area"/>
                <button type="button" class="property-button remove-property">Remove</button>
            </div>
        `);
    });

    $(document).on('click', '.remove-property', function () {
        $(this).parent('.property').remove();
    });

    $('#nftform').submit(function (event) {
        event.preventDefault();
        document.getElementById('spinner').style.display = 'block';
        document.getElementById('overlay').style.display = 'block';

        $.ajax({
            url: '/mintnft/preview',
            type: 'POST',
            data: $('#nftform').serialize()
        }).done(function (data, textStatus, jqXHR) {
            console.log(data);
            document.getElementById('errorMsgDiv').style.display = 'none';
            if (data && data.errorMsg && data.errorMsg.length !== 0) {
                $('#errorMsg').text(data.errorMsg);
                document.getElementById('errorMsgDiv').style.display = 'block';
                return;
            }

            $('#outputMsg').val(data);
            if (data.qrImgUrl) {
                // Single URL case
                showPopup(data.qrImgUrl);
            } else if (data.qrImgUrls) {
                // Multiple URLs case
                showPopup(data.qrImgUrls);
            }
            //showPopup(data.qrImgUrl);



        }).fail(function () {
            console.log('fail');
        }).always(function () {
            document.getElementById('spinner').style.display = 'none';
            document.getElementById('overlay').style.display = 'none';
        });
    });

    /* function showPopup(qrUrl) {
        $('#qrImage').attr('src', qrUrl);
        document.getElementById('popup-wrapper').style.display = 'block';
    } */
    let qrImgForNft;
    function showPopup(qrUrls) {
        const qrImagesContainer = document.getElementById('qrImagesContainer');
        qrImagesContainer.innerHTML = ''; // Clear previous images

        if (Array.isArray(qrUrls)) {
            console.log("array");
            // Handle multiple URLs
            qrUrls.forEach(qrUrl => {
                const img = document.createElement('img');
                img.src = qrUrl;
                img.className = 'qrImages';
                img.alt = 'Nft image';
                img.style.cursor = 'pointer';
                img.addEventListener('click', function () {
                    selectImage(qrUrl, img);
                });
                qrImagesContainer.appendChild(img);
            });
        } else {
            // Handle single URL
            console.log("single");
            const img = document.createElement('img');
            img.src = qrUrls;
            img.className = 'qrImage';
            img.alt = 'Nft image';
            qrImagesContainer.appendChild(img);
            qrImgForNft = qrUrls;
        }

        document.getElementById('popup-wrapper').style.display = 'block';
    }

    function selectImage(qrUrl, imgElement) {
        // Clear previous selection
        const images = document.querySelectorAll('.qrImages');
        images.forEach(img => {
            img.classList.remove('selected');
        });

        // Highlight the selected image
        imgElement.classList.add('selected');

        // Set the selected image URL
        qrImgForNft = qrUrl;
    }

    $(document).on('click', '.popup-okBtn', function (event) {
        event.preventDefault();
        document.getElementById('spinner').style.display = 'block';
        document.getElementById('overlay').style.display = 'block';

        $.ajax({
            url: '/mintnft/mint',
            type: 'POST',
            data: $('#nftform').serialize()
        }).done(function (data, textStatus, jqXHR) {
            $('#outputMsg').val(data);
            console.log('success');

            // $.get('/nftList'); //リクエストはできてるけどページが変わらない？
            window.location.href = '/nftList';//これでいけてる
        }).fail(function () {
            console.log('fail');
        }).always(function () {
            document.getElementById('spinner').style.display = 'none';
            document.getElementById('overlay').style.display = 'none';
            document.getElementById('popup-wrapper').style.display = 'none';
        });
    });

    $(document).on('click', '.popup-cancelBtn', function () {
        document.getElementById('popup-wrapper').style.display = 'none';
    })

    $('#next-button').on('click', function () {
        $('#step1').hide();
        $('#step1-content').hide();
        $('#step2').show();
        $('#step2-content').show();
        $('.main-panel').removeClass('step1').addClass('step2');
        $('.left-panel').removeClass('step1').addClass('step2');
        $('.title-box-link').removeClass('step1').addClass('step2');
        $('body#mintnft-body').removeClass('step1').addClass('step2');
    });

    $('#prev-button').on('click', function () {
        $('#step2').hide();
        $('#step2-content').hide();
        $('#step1').show();
        $('#step1-content').show();
        $('.main-panel').removeClass('step2').addClass('step1');
        $('.left-panel').removeClass('step2').addClass('step1');
        $('.title-box-link').removeClass('step2').addClass('step1');
        $('body#mintnft-body').removeClass('step2').addClass('step1');
    });


    // Function to check if all required fields are filled
    function checkRequiredFields() {
        let allFilled = true;
        $('#step1-content [required]').each(function () {
            if ($(this).val() === '') {
                allFilled = false;
                return false; // Exit loop
            }
        });

        // Enable or disable the next button based on allFilled
        $('#next-button').prop('disabled', !allFilled);
    }

    // Check fields initially
    checkRequiredFields();

    // Attach keyup and change event handlers to required fields
    $('#step1-content [required]').on('keyup change', function () {
        checkRequiredFields();
    });
});
