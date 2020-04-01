// requires: tools.js

// Visibility Togglers
const displayOverlay = displayControls("#overlay");
const displayAddimg = displayControls("#addimg");
const displayComment = displayControls("#comment");
const displayShare = displayControls("#share");

// Button Functionality
// open the image adding popup
$("#addimg-open").click(() => {
  displayAddimg.unhide();
  displayOverlay.unhide();
});
// exit the image adding popup
$("#addimg-cancel").click(() => {
  displayOverlay.hide();
  displayAddimg.hide();
});

// close the comment popup
$("#comment-cancel").click(() => {
  displayOverlay.hide();
  displayComment.hide();
})

// open the sharing popup
$("#share-open").click(() => {
  displayShare.unhide();
  displayOverlay.unhide();

  setCommentSummary();
});
// close the sharing popup
$("#share-back").click(() => {
  displayOverlay.hide();
  displayShare.hide();
});
// recalculate the comment summary if any of the conditions change
$("#check-commented").change(setCommentSummary);
// copy the summary to the clipboard when
$("#share-copy").click(() => {
  const block = $("#share-block").get(0);
  const storedSelection = [block.selectionEnd, block.selectionStart];
  block.select();
  document.execCommand("copy");
  [block.selectionEnd, block.selectionStart] = storedSelection;
});

// Add images to the gallery from the links in the popup textbox
// handle commenting
function openComment(imgSrc, cardIndex, savedComment, editedCallback) {
  $("#comment-img").attr("src", imgSrc);
  $("#comment-title").text(`Comment for Image #${cardIndex + 1}`);
  $("#comment-block").val(savedComment);

  $("#comment-save").off();
  $("#comment-save").on("click", event => {
    const newComment = $("#comment-block").val();
    editedCallback(newComment);

    displayOverlay.hide();
    displayComment.hide();
  });

  displayComment.unhide();
  displayOverlay.unhide();
}
// store the order that images are added into the gallery
// invalid images will be removed once they raise an error
// valid images will maintain their order even if they finishing loading out of // order due to size differences
const addQueue = new AsyncRefsQueue();
//
$("#addimg-done").click(() => {
  // extract urls by splitting lines
  const imgAddInput = $('#addimg-block')
  const imgSrcs = imgAddInput.val().trim().split('\n');
  imgAddInput.val("");

  $("#gallery").append(imgSrcs.map(src => {
    if (src) {
      return createImgCard(src, addQueue, openComment);
    }
  }));

  displayOverlay.hide();
  displayAddimg.hide();
});

// Generate the image order and comment summary
async function setCommentSummary() {
  // set the sharing comment by passing gui states to buildChangesSummary
  const onlyCommented = $("#check-commented").prop("checked");
  const summary = await buildChangesSummary(onlyCommented);
  $("#share-block").val(summary);
}

async function buildChangesSummary(onlyCommented) {
  // return a text block summarizing immage comments and positions
  const lines = [];
  for (const child of Array.from($("#gallery").children())) {
    if (child.tagName.toLowerCase() == "img-card") {

      const index = child.getAddQueueIndex();
      const comment = child.dataset.comment.trim();
      const imageLabel = `* Image #${index + 1}`;

      if (comment) {
        lines.push(imageLabel + ": " + comment);
      }
      else if (onlyCommented) {
        // skip adding this image
      }
      else {
        lines.push(imageLabel);
      }
    }
  }
  const summary = lines.join("\n\n");
  return summary;
}

// Testing:
// preadd album block
$("#addimg-block").val(`
https://i.imgur.com/ymu3DCM.jpg
https://i.imgur.com/wKwPbW6.jpg
https://i.imgur.com/aILGA3i.jpg
https://i.imgur.com/Pg4vCnb.jpg
https://i.imgur.com/Imh8FO9.jpg
https://i.imgur.com/Gqv5axZ.jpg
https://i.imgur.com/xnUKrOM.jpg
https://i.imgur.com/2CYQk57.jpg
`);