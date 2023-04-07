'use strict';
import Leaflet from 'leaflet';
import markerImage from 'leaflet/dist/images/marker-icon.png';
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const workoutsDiv = document.querySelector('.workout');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const modelAlert = document.querySelector('.alert-modal');
const modelOverlay = document.querySelector('.modal__overlay');
const alertButton = document.querySelector('.alert__button');
const alertCancelIcon = document.querySelector('.alert_cancel_icon');
const ModelConfirm = document.querySelector('.confirm-modal');
const cancelConfirmBtn = document.querySelector('.cancel__button');
const deleteConfirmBtn = document.querySelector('.delete__confirm__button');
const comfirmCancelIcon = document.querySelector('.comfirm_cancel_icon');
const editForm = document.querySelector('.edit--workout');
const toast = document.querySelector('.toast');
const errroMesssage = document.querySelector('.error-message');
const toastProgress = document.querySelector('.toast-progress');
const closeIcon = document.querySelector('.close');
const progress = document.querySelector('.progress');

//workout;
class workout {
  date = new Date();
  id = (Date.now() + ' ').slice(-10);
  constructor(distance, duration, coords) {
    this.distance = distance; // in km
    this.duration = duration; // in min
    this.coords = coords; // [lat, lng]
  }
  _setDescription() {
    //prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    //prettier-ignore
    this.description = `${this.type[0].toUpperCase() + this.type.slice(1)} on ${months[new Date().getMonth()]} ${new Date().getDate()}`;
    Option = {
      hour: 'numeric',
      minute: 'numeric',
    };
    if (navigator.geolocation) {
      const lang = navigator.language;
      const time = new Intl.DateTimeFormat(lang, Option).format(this.date);
      this.time = time;
    }
  }
}
class running extends workout {
  type = 'running';
  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.calPace();
    this._setDescription();
  }
  calPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class cycling extends workout {
  type = 'cycling';
  constructor(distance, duration, coords, elevationGin) {
    super(distance, duration, coords);
    this.elevationGin = elevationGin;
    this.calSpeed();
    this._setDescription();
  }
  calSpeed() {
    //km/min
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

/////////////////////////////
//PROJECT ARCHITECTURE
let workId;
let mapDiv;
let marker;
let markerArray = [];
let index;
let trashBtn;
let UpdateArray = [];
class App {
  #mapEvent;
  _mapArray = [];
  workoutZoom = 12;

  constructor() {
    this._getPostion();

    this._getLocalStorage();

    form.addEventListener('submit', this._newWorkOut.bind(this));

    inputType.addEventListener('change', this._toggleElevationField);

    containerWorkouts.addEventListener('click', this._movePopupMap.bind(this));
  }
  _getPostion() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function (error) {
          alert(error.message);
        }
      );
    }
  }
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];

    mapDiv = Leaflet.map('map').setView(coords, this.workoutZoom);

    Leaflet.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 15,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapDiv);

    //handling map event
    mapDiv.on('click', this._showForm.bind(this));

    this._mapArray.forEach(work => {
      this._readerWorkoutOnMap(work);
    });
  }
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    setTimeout(() => {
      inputDistance.focus();
    }, 100);
  }
  _hideFormData() {
    //prettier-ignore
    inputDistance.value = inputDuration.value = inputElevation.value = inputCadence.value ='';
    form.style.display = 'none';
    form.classList.add('hidden');

    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _newWorkOut(e) {
    const validInput = (...input) => input.every(inp => Number.isFinite(inp));

    const allPostive = (...input) => input.every(inp => inp > 0);

    e.preventDefault();
    // get data from a form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // checking if the type is running
    if (type === 'running') {
      const cadence = +inputCadence.value;

      // prettier-ignore;
      if (
        !validInput(distance, duration, cadence) ||
        !allPostive(distance, duration, cadence)
      ) {
        return Swal.fire({
          icon: 'error',
          title: ' <strong>Oops...</strong>  ',
          html: '<p style="font-size:14px">Please enter a valid number</p>',
          backdrop: true,
          confirmButtonColor: 'rgba(0, 0, 255, 0.288)',
        });
      }
      //prettier-ignore
      workout = new running(distance, duration, [lat,lng], cadence);
      workout.calPace();
    }

    // checking if the type is cycling
    if (type === 'cycling') {
      const elevateGin = +inputElevation.value;

      if (
        !validInput(distance, duration, elevateGin) ||
        !allPostive(distance, duration)
      ) {
        return Swal.fire({
          icon: 'error',
          title: ' <strong>Oops...</strong>  ',
          html: '<p style="font-size:14px">Please enter a valid number</p>',
          backdrop: true,
          heightAuto: false,
          confirmButtonColor: 'rgba(0, 0, 255, 0.288)',
        });
      }
      //prettier-ignore
      workout = new cycling(distance,duration,[lat, lng],elevateGin);
      workout.calSpeed();
    }

    //pushing the workout into the array

    this._mapArray.push(workout);

    //reader the workout on the map
    this._readerWorkoutOnMap(workout);

    //reader the workour on the list
    this._readerWorkoutOnList(workout);

    //check for the validation
    this._hideFormData();

    this._setLocalStorage();
  }

  _readerWorkoutOnMap(workout) {
    //display maker
    const iconImage = Leaflet.icon({
      iconUrl: markerImage,
      iconSize: [25],
      iconAnchor: [11, 13],
    });
    marker = Leaflet.marker(workout.coords, {
      riseOnHover: true,
      icon: iconImage,
    })
      .addTo(mapDiv)
      .bindPopup(
        Leaflet.popup({
          maxWidth: 200,
          minWidth: 50,
          autoClose: false,
          closeOnClick: false,
          className: `${
            workout.type === 'running' ? 'running-popup' : 'cycling-popup'
          }`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
    markerArray.push(marker);
  }
  _readerWorkoutOnList(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title" style="font-size:15px"> ${
        workout.description
      }<l style="font-size:14px; float:right"> ${workout.time}</l></h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
          }</span>
          <span class="workout__value distance_value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value  duration_value">${
            workout.duration
          }</span>
          <span class="workout__unit">min</span>
        </div>
        `;
    if (workout.type === 'running') {
      html += `<div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value  pace_value">${workout.pace.toFixed(
          2
        )}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value  workout_value cadence_value">${
          workout.cadence
        }</span>
        <span class="workout__unit">spm</span>
      </div>
      <span> <i class="bi bi-trash delete_workout_icon"style="font-size:16px;color:red"></i>
      <i class="bi bi-pencil-square"style="font-size:16px;color:darkblue;margin-left:20px"></i></span>

      </li>`;
    }
    if (workout.type === 'cycling') {
      html += `<div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value  speed_value">${workout.speed.toFixed(
          2
        )}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value  elevationGin_value">${
          workout.elevationGin
        }</span>
        <span class="workout__unit">m</span>
      </div>
      <span> <i class="bi bi-trash delete_workout_icon"style="font-size:16px;color:red;margin-top:30px"></i>
      <i class="bi bi-pencil-square"style="font-size:16px;color:darkblue;margin-left:20px"></i></span>
      </li>

      `;
    }

    form.insertAdjacentHTML('afterend', html);
    //trash button
    trashBtn = document.querySelector('.delete_workout_icon');
    trashBtn.addEventListener('click', function (e) {
      if (e.target) {
        const dataId = e.target.parentElement.parentElement.dataset.id;
        removeWorkout(dataId);
        openConfirmModel();
      }
    });
    const work = document.querySelector('.workout');
    let deleteAllWorkout = document.querySelector('.delete--all_workout');
    if (work) {
      deleteAllWorkout.classList.remove('hidden');
    } else if (!work) {
      deleteAllWorkout.classList.add('hidden');
    }

    //edit workout event
    const editBtn = document.querySelector('.bi-pencil-square');
    editBtn.addEventListener('click', this._updateUIForm.bind(this));

    //delete all workout
    deleteAllWorkout.addEventListener('click', this._deleteWorkoutFromUI);
  }

  _movePopupMap(e) {
    if (!map) return;
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;
    const workoutId = workoutEl.dataset.id;
    const workout = this._mapArray.find(work => work.id === workoutId);

    // //prettier-ignore
    mapDiv.setView(workout.coords, this.workoutZoom, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }
  //localstorage
  _setLocalStorage() {
    localStorage.setItem('workout', JSON.stringify(this._mapArray));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workout'));

    if (!data || data === null) return;

    this._mapArray = data;

    this._mapArray.forEach(work => {
      this._readerWorkoutOnList(work);
    });
  }
  removeLocalStorage(id) {
    try {
      const workout = document.querySelectorAll('.workout');
      const getItem = JSON.parse(localStorage.getItem('workout'));
      if (getItem === null) return;
      this._mapArray = getItem;
      this._mapArray.map((data, elementId) => {
        if (elementId === id) {
          workout.forEach(element => {
            const dataAttribute = element.dataset.id;
            if (dataAttribute === data.id) {
              document.querySelector(`[data-id ="${dataAttribute}"]`).remove();
            }
          });
        }
      });
      if (this._mapArray) {
        this._mapArray.splice(id, 1);
      }
      markerArray.find((_, index) => {
        if (index === id) {
          mapDiv.removeLayer(markerArray[index]);
          markerArray.splice(index, 1);
        }
      });
      if (this._mapArray.length === 0) {
        deleteAllWorkout.classList.add('hidden');
        localStorage.clear();
      } else {
        localStorage.setItem('workout', JSON.stringify(this._mapArray));
      }
    } catch (error) {
      alert(error);
    }
  }
  _updateUIForm(e) {
    try {
      const getDataId = e.target.parentElement.parentElement.dataset.id;
      if (UpdateArray.length > 0) {
        UpdateArray = [];
      }
      UpdateArray = this._mapArray;
      UpdateArray.forEach((workElement, id) => {
        if (workElement.id === getDataId) {
          let html = `
          <h2 class="edit_workout_header">Edit Workout</h2>
          <div class="header__border"></div>
          <form class="update_form"data-type="${workElement.type}" data-id="${
            workElement.id
          }">
            <div>
            <label for="type"class="form-label">Type</label>
            <select>
            <option value="Running">${
              workElement.type.charAt(0).toUpperCase() +
              workElement.type.slice(1)
            }</option>
  
            </select>
            </div>
  
            <div>
              <label for="Distance"  class="form-label"> Distance</label>
              <input
                class="update_form_input update--distance"
                type="text" id="distance"value="${workElement.distance}"
                placeholder="Distance"
              />
  
            </div>
            <div>
              <label class="form-label"> Duration</label>
              <input
                class="update_form_input update--duration"
                type="text" id="duration" value="${workElement.duration}"
                placeholder="duration"
              />
  
            </div>
  
        `;
          if (workElement.type === 'running') {
            html += `
            <div>
            <label class="form-label">Cadence</label>
            <input class="update_form_input update--cadence" id="cadence"type="text" placeholder="Cadence"value="${workElement.cadence}" />
            <span></span>
            </div>
  
            <div class="update__btn">
            <button type="button" class="btn--update_close">Close</button>
            <button type="submit" class="btn--update">
            <h1  class="saveBtn"style="font-size:14px">Save Changes</h1>
            <h1 class="loader" style="display:none;font-size:14px">Processing..</h1>
            </button>
          </div>`;
          }
          if (workElement.type === 'cycling') {
            html += `
            <div>
            <label class="form-label">ElevationGin</label>
             <input class="update_form_input update--elevationGin" id="elevationGin" type="text" placeholder="elevation" value="${workElement.elevationGin}" />
            </div>
             <div class="update__btn">
             <button type="button" class="btn--update_close">Close</button>
             <button type="submit" class="btn--update">
             <h1  class="saveBtn"style="font-size:14px">Save Changes</h1>
             <h1 class="loader" style="display:none;font-size:14px">Processing...</h1>
  
             </button>
           </div>`;
          }

          editForm.insertAdjacentHTML('afterbegin', html);
          openEditFormModel();
          editForm.style.display = 'block';
          index = id;
        }
      });
      const closeEditBtn = document.querySelector('.btn--update_close');
      modelOverlay.addEventListener('click', closeEditFormModel);
      closeEditBtn.addEventListener('click', closeEditFormModel);

      document.addEventListener('click', function (e) {
        if (e.key === 'Escape') {
          closeEditFormModel();
        }
      });
      const updatework = document.querySelector('.btn--update');
      updatework.addEventListener('click', this._updateLocalWorkout);
    } catch (error) {
      alert(error);
    }
  }
  _updateLocalWorkout(e) {
    e.preventDefault();
    const parentElement = e.target.parentElement.parentElement.parentElement;

    //update input fleid
    const type = e.target.closest('.update_form').dataset.type;
    const updateDistance = parentElement.querySelector('.update--distance');
    const updateDuration = parentElement.querySelector('.update--duration');
    const updateCadence = parentElement.querySelector('.update--cadence');

    console.log(type, updateCadence, updateDistance, updateDuration);
    //prettier-ignore
    const updateElevation = parentElement.querySelector('.update--elevationGin');
    //prettier-ignore
    if (type === 'running') {
      if(checkDistance(updateDistance) && checkDistance(updateDuration) && checkCadence(updateCadence))
       {
        const updateDataFromLocal = localStorage.getItem('workout');
        const updatePace =
          Number(updateDuration.value) / Number(updateDistance.value);
        if (updateDataFromLocal != null) {
          const response = JSON.parse(updateDataFromLocal);
          response[index].distance = updateDistance.value;
          response[index].duration = updateDuration.value;
          response[index].cadence = updateCadence.value;
          response[index].pace = updatePace;
          let loader = document.querySelector(".loader");
          let saveBtn = document.querySelector(".saveBtn")
            saveBtn.style.display = "none"
            loader.style.display = "block";
            let updateLoader = document.querySelector(".update-loader");
           updateLoader.style.visibility = "visible";
           setTimeout(()=>{
          localStorage.setItem('workout', JSON.stringify(response));

          saveBtn.style.display = "block";
          loader.style.display = "none";
          updateLoader.style.visibility = "hidden";
          editForm.style.display = "none";
          modelOverlay.style.display = "none";
          toastProgress.style.display = "block";
           let timer1, timer2;
            toastProgress.classList.add('active');
            progress.classList.add('active');

             timer1 = setTimeout(() => {
             toastProgress.classList.remove('active');
            }, 5000); //1s = 1000 milliseconds

            timer2 = setTimeout(() => {
               progress.classList.remove('active');
          }, 5300);

          closeIcon.addEventListener('click', () => {
         toastProgress.classList.remove('active');

         setTimeout(() => {
        progress.classList.remove('active');
          }, 300);

         clearTimeout(timer1);
         clearTimeout(timer2);
      });
          },6000)

        }

      }
      setTimeout(()=>{
        toastProgress.style.right = "-100px"
        toastProgress.style.transition ="all 1s ease"
      },11000);
      setTimeout(()=>{
        location.reload()
      },11500)

      }
    //prettier-ignore
    if ( type ==="cycling"){
        if(checkDistance(updateDistance) && checkDistance(updateDuration) && checkCadence(updateElevation))
        {

          const updateDataFromLocal = localStorage.getItem('workout');
          const updateSpeed =
            Number(updateDistance.value) / Number(updateDuration.value);
          if (updateDataFromLocal != null) {
            const response = JSON.parse(updateDataFromLocal);
            response[index].distance = updateDistance.value;
            response[index].duration = updateDuration.value;
            response[index].elevationGin = updateElevation.value;
            response[index].speed = updateSpeed;

            let loader = document.querySelector(".loader");
            let saveBtn = document.querySelector(".saveBtn")
              saveBtn.style.display = "none"
              loader.style.display = "block";
              let updateLoader = document.querySelector(".update-loader");
             updateLoader.style.visibility = "visible";
             setTimeout(()=>{
            localStorage.setItem('workout', JSON.stringify(response));

            saveBtn.style.display = "block";
            loader.style.display = "none";
            updateLoader.style.visibility = "hidden";
            editForm.style.display = "none";
            modelOverlay.style.display = "none";
            toastProgress.style.display = "block";

             let timer1, timer2;
              toastProgress.classList.add('active');
              progress.classList.add('active');

               timer1 = setTimeout(() => {
               toastProgress.classList.remove('active');
              }, 5000); //1s = 1000 milliseconds

              timer2 = setTimeout(() => {
                 progress.classList.remove('active');
            }, 5300);

            closeIcon.addEventListener('click', () =>
           {
              toastProgress.classList.remove('active');

               setTimeout(() => {
                progress.classList.remove('active');
                }, 300);

                clearTimeout(timer1);
                  clearTimeout(timer2);
                });

            },6000)
          }
        }
        setTimeout(()=>{
          toastProgress.style.visibility = "hidden";
          toastProgress.style.transition ="all 1s ease opacity 0";
        },11000);
           setTimeout(()=>{
        location.reload()
      },11500)

      }
  }
  _deleteWorkoutFromUI(e) {
    if (e.target) e.preventDefault();
    localStorage.clear();
    location.reload();
  }
}

//confirmation modal
const openConfirmModel = function () {
  ModelConfirm.classList.remove('modal__hidden');
  modelOverlay.classList.remove('modal__hidden');
};

const closeConfirmModal = function () {
  ModelConfirm.classList.add('modal__hidden');
  modelOverlay.classList.add('modal__hidden');
  inputDistance.focus();
};

const removeConfirmModal = function () {
  cancelConfirmBtn.addEventListener('click', closeConfirmModal);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeConfirmModal();
    }
  });
  modelOverlay.addEventListener('click', closeConfirmModal);
  comfirmCancelIcon.addEventListener('click', closeConfirmModal);
};

//delete workout  by click the delete btn popup
const removeWorkout = function (dataId) {
  let arr = [];
  deleteConfirmBtn.addEventListener('click', function (e) {
    if (e.target) {
      const localItem = JSON.parse(localStorage.getItem('workout'));
      if (arr.length > 0) {
        arr = [];
      }
      arr = localItem;
      arr.forEach((element, id) => {
        if (element.id === dataId) {
          localApp.removeLocalStorage(id);
          closeConfirmModal();
        }
      });
    }
  });
};

//edit comfirmation model
function closeEditFormModel(e) {
  window.location.reload();
}

const openEditFormModel = function () {
  editForm.classList.remove('modal__hidden');
  modelOverlay.classList.remove('modal__hidden');
};

const removeEditFormModel = function () {
  modelOverlay.addEventListener('click', closeEditFormModel);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeEditFormModel();
    }
  });
};

//update woorkout
const showError = function (input, message) {
  const formElement = input.parentElement;
  formElement.className = 'form-error';
  errroMesssage.innerText = message;
  toast.classList.remove('toast-hidden');
  toast.style.opacity = 1;
  setTimeout(() => {
    toast.style.opacity = 0;
  }, 2000);
};
const showSucess = function (input) {
  const formElement = input.parentElement;
  formElement.className = 'form-success';
  toast.classList.add('toast-hidden');
};
//check all input
const checkDistance = function (input) {
  const regx = /^[0-9.]{1,1000}$/;
  const max = 1000;
  const min = 1;
  if (input.value.trim() == '') {
    showError(input, 'field is required');
    return false;
  }
  if (!regx.test(Number(input.value))) {
    showError(input, 'field must be a number');
    return false;
  }
  if (Number(input.value) > max) {
    showError(input, `field must not exceed ${max}`);
    return false;
  }
  if (Number(input.value) < min && input.value != '') {
    showError(input, `field must not be lower than  ${min}`);
    return false;
  } else {
    showSucess(input);
    return true;
  }
};

const checkDuration = function (input) {
  const regx = /^[0-9.]{1,1000}$/;
  const max = 1000;
  const min = 1;
  if (input.value.trim() == '') {
    showError(input, 'field is required');
    return false;
  }
  if (!regx.test(Number(input.value))) {
    showError(input, 'field must be a number');
    return false;
  }
  if (Number(input.value) > max) {
    showError(input, `field must not exceed ${max}`);
    return false;
  }
  if (Number(input.value) < min && input.value != '') {
    showError(input, `field must not be lower than  ${min}`);
    return false;
  } else {
    showSucess(input);
    return true;
  }
};
const checkCadence = function (input) {
  const regx = /^[0-9.]{1,1000}$/;
  const max = 1000;
  const min = 1;
  if (input.value.trim() == '') {
    showError(input, 'field is required');
    return false;
  }
  if (!regx.test(Number(input.value))) {
    showError(input, 'field must be a number');
    return false;
  }
  if (Number(input.value) > max) {
    showError(input, `field must not exceed ${max}`);
    return false;
  }
  if (Number(input.value) < min && input.value != '') {
    showError(input, `field must not be lower than  ${min}`);
    return false;
  } else {
    showSucess(input);
    return true;
  }
};
const checkElevationGin = function (input) {
  const regx = /^[0-9.]{1,1000}$/;
  const max = 1000;
  const min = 1;
  if (input.value.trim() == '') {
    showError(input, 'field is required');
    return false;
  }
  if (!regx.test(Number(input.value))) {
    showError(input, 'field must be a number');
    return false;
  }
  if (Number(input.value) > max) {
    showError(input, `field must not exceed ${max}`);
    return false;
  }
  if (Number(input.value) < min && input.value != '') {
    showError(input, `field must not be lower than  ${min}`);
    return false;
  } else {
    showSucess(input);
    return true;
  }
};

const getInputName = function (input) {
  return input.id.charAt(0).toUpperCase() + input.id.slice(1);
};

const localApp = new App();
closeConfirmModal();
removeConfirmModal();

if (module.hot) {
  module.hot.accept();
}
