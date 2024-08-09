document.addEventListener("DOMContentLoaded", function() {
    const modalContainer = document.getElementById("modal-container");
    const modalHeaderBanner = document.getElementById("modal-header-banner");
    const modalImage = document.getElementById("modal-image");
    const modalImageLink = document.getElementById("modal-image-link");
    const modalCaption = document.getElementById("modal-caption");
    const modalClose = document.getElementById("modal-close");
  
    const modalOpenerElements = document.querySelectorAll(".modal-opener");
  
    modalOpenerElements.forEach(opener => {
      opener.addEventListener("click", function() {
        const index = this.getAttribute("data-index");
        const nft = nfts[index]; // nfts は nftView.ejs から渡される
  
        if (nft) {
            console.log(nft);
          modalImage.src = nft.imageUrl;
          modalImage.alt = nft.name || "Image";
          modalImageLink.href = "https://test.bithomp.com/en/nft/" +  nft.id;
          modalHeaderBanner.textContent = nft.name || "No name available";
  
        //   modalContainer.style.display = "block";
          modalContainer.style.display = 'flex'; // モーダルを表示
        }

        // モーダルを閉じる関数
    function closeModal() {
        modalContainer.style.display = 'none'; // モーダルを非表示
    }
      });
    });
  
    modalClose.addEventListener("click", function() {
      modalContainer.style.display = "none";
    });
  
    window.addEventListener("click", function(event) {
      if (event.target === modalContainer) {
        modalContainer.style.display = "none";
      }
    });
  });
