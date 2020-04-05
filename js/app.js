// requires: tools.js

// Visibility Togglers
const displayOverlay = displayControls("#overlay");
const displayAddimg = displayControls("#addimg");
const displayComment = displayControls("#comment");
const displaypubl = displayControls("#publ");

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
$("#publ-open").click(() => {
  displaypubl.unhide();
  displayOverlay.unhide();

  setCommentSummary();
});
// close the sharing popup
$("#publ-back").click(() => {
  displayOverlay.hide();
  displaypubl.hide();
});
// recalculate the comment summary if any of the conditions change
$("#check-commented").change(setCommentSummary);
// copy the summary to the clipboard when
$("#publ-copy").click(() => {
  const block = $("#publ-block").get(0);
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

async function parseSingleImageSrc(src) {
  // takes a proposed image src and returns a list of image src strings
  // if the src is:
  //   invalid an empty list is returned
  //   a single url a list containing the url is returned
  //   an album url, a list of image urls in the album is returned

  if (src == "") {
    return [];
  }
  else {
    // check album matches

    // imgur
    const match_imgur = src.match(
      /^(?:https?:\/\/)?imgur\.com\/a\/([a-zA-Z0-9]+)/
    )
    if (match_imgur) {
      const album_id = match_imgur[1];

      const response = await fetch(
        `https://imgrvr.herokuapp.com/album/imgur/${album_id}`
      );

      const response_json = await response.json();

      if (response_json.success) {
        return response_json.image_urls;
      }
    }
    else {
      // no album matches
      return [src]
    }

  }
}

async function addImages() {
  // handle adding images from textarea once done button is pressed

  const imgAddInput = $('#addimg-block');
  const imgSrcs = imgAddInput.val().trim().split('\n');
  imgAddInput.val("");

  for (const src of imgSrcs) {
    const parsedSrcs = await parseSingleImageSrc(src);

    $("#gallery").append(parsedSrcs.map(src => {
      return createImgCard(src, addQueue, openComment);
    }));
  }

  displayOverlay.hide();
  displayAddimg.hide();
}

$("#addimg-done").click(() => addImages());

// Generate the image order and comment summary
async function setCommentSummary() {
  // set the sharing comment by passing gui states to buildChangesSummary
  const onlyCommented = $("#check-commented").prop("checked");
  const summary = await buildChangesSummary(onlyCommented);
  $("#publ-block").val(summary);
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