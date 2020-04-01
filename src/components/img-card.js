// requires: tools.js
// styling: img-card.css

(function () {
  // Custom element img-card
  // Interactive gallery image with tools to manipulate it
  // Setup by calling `initialize`

  const template = templateFromHtml(`
  <img>
  <div class="bumper left" data-direction="before"></div>
  <div class="bumper right" data-direction="after"></div>
  <div class="tool remove bg-red" title="Remove"></div>
  <div class="tool move bg-grey" title="Drag-and-Drop"></div>
  <div class="tool comment bg-blue" title="Add a Comment"></div>
  `)

  // configure functionality
  const cfg = {
    class: {
      proxy: "img-card-proxy",
      drag: {
        card: "being-dragged",
        gallery: "has-dragging"
      }
    },
    offset: {
      x: 6, y: 6
    }
  }

  // internal element selectors
  const selector = {
    img: 'img',
    remove: ".tool.remove",
    move: ".tool.move",
    comment: ".tool.comment"
  }

  customElements.define('img-card', class extends HTMLElement {

    initialize(imgSrc, addQueueCallbacks, commentCallback) {
      // setup structure and functionality

      insertTemplateInto(this, template);

      // prevent user from dragging a ghost of the card
      this.setAttribute("draggable", false);

      // create element display controller
      this.display = displayControls(this);
      this.display.hide();

      // setup card image
      this.setAddQueueCallbacks(addQueueCallbacks);
      this.setImageSrc(imgSrc);

      // setup functionality
      this.setupMove(cfg);
      this.setupRemove(cfg);
      this.setupComment(commentCallback);
    }

    setAddQueueCallbacks(addQueueCallbacks) {
      // store callbacks that can be used to remove this image from the
      // added queue if its image source is not valid
      this.addQueue = addQueueCallbacks;
    }

    setImageSrc(imgSrc) {
      // validate and set `imgSrc` into the card's image child
      const img = $(this).find(selector.img).get(0);
      img.onload = event => {
        this.display.unhide();
        img.onload = undefined;
      };
      // handle case where image src could not be loaded
      img.onerror = event => {
        console.error("failed to load image from src:", imgSrc);
        this.display.hide();
        this.addQueue.remove(); // exclude this image from the added order
        this.remove();
      };
      img.setAttribute("src", imgSrc);
    }

    getAddQueueIndex() {
      // get the position of this card out of those that were added in this
      // session except those whose image src caused an error
      return this.addQueue.getQueueIndex();
    }

    setupRemove() {
      const handleclick = event => {
        event.stopPropagation();

        // TODO handle undo delete:
        // move element to queue and mark its previous sibling
        this.remove();
      }

      $(this).find(selector.remove).on("click", handleclick);
    }

    setupMove(cfg) {
      // define the handling functions so they have access to `this`
      const moveOffsetX = cfg.offset.x;
      const moveOffsetY = cfg.offset.y;

      const handleMouseDown = event => {
        event.stopPropagation();

        this.classList.add(cfg.class.drag.card);
        this.parentElement.classList.add(cfg.class.drag.gallery);
        document.documentElement.classList.add(cfg.class.drag.gallery);

        // cursor position relative to this element
        const thisRect = this.getBoundingClientRect();
        this.offsetX = event.clientX - thisRect.left + moveOffsetX;
        this.offsetY = event.clientY - thisRect.top + moveOffsetY;

        // make this movable and snap it to the top-left of the parent
        this.style.position = 'absolute';

        // create a proxy that has the same size and display as the card
        const insertProxy = this.insertProxy = document.createElement('div');
        insertProxy.classList.add(cfg.class.proxy);
        const thisStyle = getComputedStyle(this);
        insertProxy.style.display = thisStyle.display;
        insertProxy.style.width = thisStyle.width;
        insertProxy.style.height = thisStyle.height;

        // listen for general mouse events to react to
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        // listen for the mouse hitting any card's bumpers from the gallery
        this.parentElement.addEventListener('mouseover', handleMouseOver);

        // snap to cursor right away
        handleMouseMove(event);
        // snap the proxy in place of where this card used to be
        this.parentElement.insertBefore(insertProxy, this);
      }

      const handleMouseUp = event => {
        event.stopPropagation();
        // console.log('mouseup', event.target);

        this.classList.remove(cfg.class.drag.card);
        this.parentElement.classList.remove(cfg.class.drag.gallery);
        document.documentElement.classList.remove(cfg.class.drag.gallery);

        // restore attributes
        this.style.position = 'relative';
        this.style.transform = '';

        // disconnect created listeners
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        this.parentElement.removeEventListener('mouseover', handleMouseOver);

        // swap this element with proxy
        try {
          this.parentElement.insertBefore(this, this.insertProxy);
        }
        catch (error) {
          if (String(error) === "NotFoundError: Node was not found") {
            // do not swap (stay in original spot) because proxy was
            // never allocated
          }
          else {
            throw error;
          }

        }
        this.insertProxy.remove();
        delete this.insertProxy;
      }

      const handleMouseMove = event => {
        event.stopPropagation();
        // while cursor is moving while dragging this element

        // client position of offset parent
        const parentClient = this.offsetParent.getBoundingClientRect();

        const newX = event.clientX - this.offsetX - parentClient.left;
        const newY = event.clientY - this.offsetY - parentClient.top;

        this.style.transform = 'translate(' + newX + 'px, ' + newY + 'px)';
      }

      const handleMouseOver = event => {
        event.stopPropagation();
        // console.log('mouseover', event.target);

        const target = event.target;

        if (target.dataset.direction) {
          const card = target.parentElement;
          const gallery = card.parentElement;

          switch (target.dataset.direction) {
            case 'before':
              // console.log('insert', this.insertProxy, 'before', card);
              gallery.insertBefore(this.insertProxy, card);

              break;
            case 'after':
              insertAfter(this.insertProxy, card, gallery);
              break;
          }

        }
      }

      $(this).find(selector.move).on('mousedown', handleMouseDown);
    }

    setComment(newComment) {
      // TODO
      this.dataset.comment = newComment;
    }

    setupComment(commentCallback) {
      // TODO
      this.setComment("");

      $(this).find(selector.comment).on("click", event => {
        const imgSrc = $(this).find(selector.img).attr("src");
        const cardIndex = this.getAddQueueIndex();
        const savedComment = this.dataset.comment;
        commentCallback(
          imgSrc, cardIndex, savedComment,
          newComment => {
            this.setComment(newComment);
          }
        );
      });
      return null;
      // TODO
    }
  });

})();

function createImgCard(imgSrc, addQueue, commentCallback) {
  // Create and return a new img-card element that is initialized in proper
  // within the `addQueue` and will call `commentCallback` when its commenting
  // button is pressed

  const card = document.createElement('img-card');
  const addQueueCallbacks = addQueue.addRef(card);
  card.initialize(imgSrc, addQueueCallbacks, commentCallback);
  return card;
}


