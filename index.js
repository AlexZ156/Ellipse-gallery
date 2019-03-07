const galleryData = [
  {
    img: ''
  },
  {
    img: ''
  },
  {
    img: ''
  },
  {
    img: ''
  },
  {
    img: ''
  },

  //
  {
    img: ''
  },
  {
    img: ''
  },
  {
    img: ''
  },
  {
    img: ''
  },
  {
    img: ''
  },
  {
    img: ''
  },
  {
    img: ''
  }
];

document.addEventListener('DOMContentLoaded', () => {
  const galleries = document.querySelectorAll('.ellipse-gallery');

  for (const gallery of Array.from(galleries)) {
    new EllipseGallery({
      gallery,
      slidesData: galleryData,
      beforeNextSlide(currIndex, prevIndex) {

      },
      beforePrevSlide(currIndex, prevIndex) {

      },
      beforeGoToSlide(currIndex, prevIndex) {

      },
      slideEnd() {

      }
    });
  }
});

class EllipseGallery {
  options = {
    slidesToShow: 5,
    slidesData: [],
    ellipseRatio: 0.5, // height / width
    nextBtn: '.next',
    prevBtn: '.prev',
    lastSlideScale: 0.3, // from 0 to 1
    animDuration: 800, // ms
    shearFactor: 0.8 // from 0 to 1
  };

  slides = [];

  ellipse = 2 * Math.PI;

  ellipseLength = 0;

  ellipseLengthKoef = 0;

  direction = 1; // slide direction

  isAnimationActive = false;

  currentIndex = 0; // active slide index

  constructor(options) {
    Object.assign(this.options, options);
    this.defineElements();
    this.createSlides();
    this.options.slidesToShow = Math.min(this.options.slidesToShow, this.slides.length);
    this.onWindowResize();
    this.attachEvents();
  }

  defineElements() {
    this.gallery = this.options.gallery;
    this.nextBtn = this.gallery.querySelector(this.options.nextBtn);
    this.prevBtn = this.gallery.querySelector(this.options.prevBtn);
  }

  attachEvents() {
    this.nextSlide = this.nextSlide.bind(this);
    this.prevSlide = this.prevSlide.bind(this);
    this.numSlide = this.numSlide.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
    this.nextBtn.addEventListener('click', this.nextSlide);
    this.prevBtn.addEventListener('click', this.prevSlide);
    this.gallery.addEventListener('click', this.numSlide);
    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('load', this.onWindowResize);
    window.addEventListener('orientationchange', this.onWindowResize);
  }

  onWindowResize() {
    this.updateParams();
    this.setGalleryHeight();
    this.setSlidesPosition();
  }

  nextSlide(e) {
    e && e.preventDefault();
    if (!this.isAnimationActive) {
      this.prevIndex = this.currentIndex;
      if (this.currentIndex < this.slides.length -1) {
        this.currentIndex++;
      } else {
        this.currentIndex = 0;
      }

      this.direction = 1;
      this.setSlidesPosition(true);
      this.makeCallback('beforeNextSlide', this.currentIndex, this.prevIndex);
    }
  }

  prevSlide(e) {
    e && e.preventDefault();
    if (!this.isAnimationActive) {
      this.prevIndex = this.currentIndex;
      if (this.currentIndex > 0) {
        this.currentIndex--;
      } else {
        this.currentIndex = this.slides.length - 1;
      }

      this.direction = -1;
      this.setSlidesPosition(true);
      this.makeCallback('beforePrevSlide', this.currentIndex, this.prevIndex);
    }
  }

  numSlide(e) {
    if (!this.isAnimationActive) {
      e && e.preventDefault();
      const slideIndex = this.getSlideIndex(e.target);
      this.goToSlide(slideIndex);
    }
  }

  goToSlide(num) {
    if (num !== null && num !== this.currentIndex) {
      this.prevIndex = this.currentIndex;
      num = Math.max(Math.min(num, this.slides.length - 1), 0);
      this.currentIndex = num;
      this.direction = 1;
      this.setSlidesPosition(true);
      this.makeCallback('beforeGoToSlide', this.currentIndex, this.prevIndex);
    }
  }

  getSlideIndex(targetSlide) {
    const slide = this.slides.find(({slide}) => slide === targetSlide);

    return slide ? slide.index : null;
  }

  defineSlideVisibility() {
    const slidesIndexArr = this.getSlidesIndexByNum(this.currentIndex);
    const step = this.ellipse / this.options.slidesToShow;
    const diff = this.ellipse - step * (this.options.slidesToShow - 1) * this.options.shearFactor;
    const hiddenPosition = (this.options.slidesToShow * step) - diff / 2;

    for (let i = 0; i < this.slides.length; i++) {
      const slide = this.slides[i];
      const arrayIndex = slidesIndexArr.indexOf(i);
      let currPosition = step * arrayIndex * this.options.shearFactor;

      if (arrayIndex !== -1 && arrayIndex !== 0 && arrayIndex !== slidesIndexArr.length - 1) {
        currPosition += this.ellipseLengthKoef * (slidesIndexArr.length - 1 - arrayIndex) * slide.width * (1 - this.options.lastSlideScale) / 5;
      }

      slide.prevPosition = slide.currentPosition;
      slide.currentPosition = arrayIndex !== -1 ? currPosition : hiddenPosition;
      slide.active = arrayIndex !== -1;

      if (typeof slide.prevPosition === 'undefined') {
        slide.prevPosition = slide.currentPosition;
      }
    }
  }

  getSlidesIndexByNum(num) {
    const diff = this.slides.length - (num + this.options.slidesToShow);
    let indexArr = this.slides.slice(num, num + this.options.slidesToShow);

    if (diff < 0) {
      indexArr = indexArr.concat(this.slides.slice(0, Math.abs(diff)));
    }

    return indexArr.map(({index}) => index);
  }

  createSlides() {
    for (let i = 0; i < this.options.slidesData.length; i++) {
      const slide = document.createElement('div');
      slide.classList.add('slide');
      this.slides.push({ slide, index: i });
      this.gallery.appendChild(slide);
    }
  }

  getSlideSize(slide) {
    return {
      width: slide.clientWidth,
      height: slide.clientHeight,
    };
  }

  getSlideParams(slideItem, progress = 1) {
    const scaleStep = (1 - this.options.lastSlideScale) / this.options.slidesToShow;
    let diff = slideItem.currentPosition - slideItem.prevPosition;

    if (diff * this.direction > 0) {
      diff = (-this.ellipse + Math.abs(diff)) * this.direction;
    }

    const value = Math.PI - slideItem.prevPosition - diff * progress;
    const left = this.galleryWidth / 2 * Math.cos(value) + this.galleryWidth / 2 - slideItem.width / 2;
    const top = this.galleryHeight / 2 * Math.sin(value) + this.galleryHeight / 2 - slideItem.height / 2;
    const scale = slideItem.active ? 1 - scaleStep * slideItem.currentPosition : 0;

    return { left, top, scale };
  }

  setSlidesPosition(shouldAnimate) {
    if (this.isAnimationActive) {
      return;
    }
    const waitArray = [];
    this.defineSlideVisibility();

    for (let i = 0; i < this.slides.length; i++) {
      const item = this.slides[i];

      if (shouldAnimate) {
        if (item.currentPosition !== item.prevPosition) {
          waitArray.push(this.animate(item));
        }
      } else {
        item.params = this.getSlideParams(item);
        this.updateSlidePosition(item.slide, item.params);
      }
    }

    if (shouldAnimate) {
      this.isAnimationActive = true;
      Promise.all(waitArray).then(() => {
        this.isAnimationActive = false;
        this.makeCallback('slideEnd', this);
      });
    }
  }

  updateSlidePosition(slide, { left, top, scale}) {
    slide.style.left = `${left}px`;
    slide.style.top = `${top}px`;
    slide.style.transform = `scale(${scale})`;
  }

  updateParams() {
    this.galleryWidth = this.gallery.clientWidth;
    this.galleryHeight = this.galleryWidth * this.options.ellipseRatio;
    this.ellipseLength = Math.PI * (this.galleryWidth + this.galleryHeight) / 2;
    this.ellipseLengthKoef = this.ellipse / this.ellipseLength;
    for (const item of this.slides) {
      Object.assign(item, this.getSlideSize(item.slide));
    }
  }

  setGalleryHeight() {
    this.gallery.style.height = `${this.galleryHeight}px`;
  }

  animate(item) {
    item.params = this.getSlideParams(item);
    const prevScale = item.slide.getBoundingClientRect().width / item.width;
    const scaleDiff = prevScale - item.params.scale;

    return this.animation({
      duration: this.options.animDuration,
      draw: (progress) => {
        item.params = this.getSlideParams(item, progress);
        const { left, top } = item.params;
        const scale = prevScale - scaleDiff * progress;
        item.params.scale = scale;
        this.updateSlidePosition(item.slide, { left, top, scale });
      }
    });
  }

  animation(options) {
    return new Promise(resolve => {
      const start = performance.now();
      const animate = (time) => {
        let timeFraction = (time - start) / options.duration;
        if (timeFraction > 1 || !this.isAnimationActive) {
          timeFraction = 1;
          resolve();
        }

        const progress = Math.max(Math.pow(timeFraction, 2), 0);

        options.draw(progress);

        if (timeFraction < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    });
  }

  makeCallback(name, ...arg) {
    if (typeof this.options[name] === 'function') {
      const args = Array.prototype.slice.call(arg);
      this.options[name].apply(this, args);
    }
  }

  destroy() {
    this.nextBtn.removeEventListener('click', this.nextSlide);
    this.prevBtn.removeEventListener('click', this.prevSlide);
    this.gallery.removeEventListener('click', this.numSlide);
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('load', this.onWindowResize);
    window.removeEventListener('orientationchange', this.onWindowResize);
    for (const item of this.slides) {
      item.slide.style.left = '';
      item.slide.style.top = '';
      item.slide.style.transform = '';
    }
    this.isAnimationActive = false;
  }
}