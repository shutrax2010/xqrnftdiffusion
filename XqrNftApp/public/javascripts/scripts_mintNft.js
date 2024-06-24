$(document).ready(function () {
    let propertyCount = 2; // 初期プロパティの数

    // 新しいプロパティフィールドを追加する関数
    function addPropertyField() {
        propertyCount++;
        const propertyHtml = `
            <div class="property" id="property-${propertyCount}">
                <input type="text" name="propertyName${propertyCount}" class="property-name input-area"/>
                <input type="text" name="propertyValue${propertyCount}" class="property-value input-area"/>
                <button type="button" class="property-button remove-button" onclick="removePropertyField(${propertyCount})">Remove</button>
            </div>
        `;
        $('#properties-container').append(propertyHtml);
        updatePropertyCount();
    }

    // プロパティフィールドを削除する関数
    window.removePropertyField = function (id) {
        $(`#property-${id}`).remove();
    }

    // プロパティ追加ボタンのクリックイベント
    $('#add-property-button').click(function () {
        addPropertyField();
    });

    function updatePropertyCount() {
        $('#propertyCount').val(propertyCount);
    }

    // フォーム送信
    $('#mint-button').click(function (event) {
        event.preventDefault();
        $.ajax({
            url: '/mintnft/mint',
            type: 'POST',
            data: $('#nftform').serialize()
        }).done(function (data, textStatus, jqXHR) {
            $('#outputMsg').val(data);
            console.log('success');
        }).fail(function () {
            console.log('fail');
        });
    });
});
