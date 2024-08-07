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

    $('#nftform').submit(async function (event) {
        event.preventDefault();
        document.getElementById('spinner').style.display = 'block';
        document.getElementById('overlay').style.display = 'block';
        try {
            // Step 1: Create Check
            const checkResponse = await $.ajax({
                url: '/mintnft/checktype',
                type: 'POST',
                data: $('#nftform').serialize()
            });

            if (checkResponse.redirectUrl) {
                // Redirect to Xumm for signing if redirectUrl is present
                console.log('Redirecting to Xumm sign-in:', checkResponse.redirectUrl);
                const signInWindow = window.open(checkResponse.redirectUrl.url, '_blank', 'width=700,height=600');
                const payloadUUID = checkResponse.redirectUrl.uuid;

                // Check the status of the sign-in every 5 seconds
                const intervalId = setInterval(async () => {
                    try {
                        const response = await fetch(`/payload/${payloadUUID}`);
                        const payloadData = await response.json();

                        if (payloadData.status === 'completed' && payloadData.resolved) {
                            clearInterval(intervalId);
                            console.log('Sign-in completed!');
                            if (signInWindow) {
                                signInWindow.close();
                            }
                            // Proceed to mint the NFT after successful sign-in
                            await mintNFT(payloadData.txid);
                            document.getElementById('spinner').style.display = 'none';
                            document.getElementById('overlay').style.display = 'none';
                        }
                    } catch (error) {
                        console.error('Error fetching payload status:', error);
                    }
                }, 5000); // Check status every 5 seconds
            } else {
                // No redirectUrl provided, proceed to mint the NFT directly
                await mintNFT();
                document.getElementById('spinner').style.display = 'none';
                document.getElementById('overlay').style.display = 'none';
            }
        } catch (error) {
            console.error('Error creating check:', error);
            document.getElementById('spinner').style.display = 'none';
            document.getElementById('overlay').style.display = 'none';
        }
    });

    async function mintNFT(checkId = null) {
        try {
            let dataToSend;

            if (checkId) {
                // If payloadUUID is provided, include it in the data
                dataToSend = $.extend($('#nftform').serializeArray(), { checkID: checkId });
            } else {
                // If payloadUUID is not provided, just serialize the form data
                dataToSend = $('#nftform').serialize();
            }
            const mintResponse = await $.ajax({
                url: '/mintnft/preview',
                type: 'POST',
                data: dataToSend
            });

            console.log(mintResponse);
            document.getElementById('errorMsgDiv').style.display = 'none';
            if (mintResponse.errorMsg) {
                $('#errorMsg').text(mintResponse.errorMsg);
                document.getElementById('errorMsgDiv').style.display = 'block';
                return;
            }

            $('#outputMsg').val(mintResponse.outputMsg || 'NFT minted successfully!');

            if (mintResponse.qrImgUrl) {
                // Single URL case
                showPopup(mintResponse.qrImgUrl);
                document.getElementById('spinner').style.display = 'none';
                document.getElementById('overlay').style.display = 'none';
            } else if (mintResponse.qrImgUrls) {
                // Multiple URLs case
                showPopup(mintResponse.qrImgUrls);
                document.getElementById('spinner').style.display = 'none';
                document.getElementById('overlay').style.display = 'none';
            }
        } catch (error) {
            console.error('Error minting NFT:', error);
            document.getElementById('spinner').style.display = 'none';
            document.getElementById('overlay').style.display = 'none';
        }
    }

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
