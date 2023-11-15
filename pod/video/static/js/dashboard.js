var bulkUpdateActionSelect = document.getElementById("bulkUpdateActionSelect");
var confirmBulkUpdateBtn = document.getElementById("confirmBulkUpdateBtn");
var btnDisplayMode = document.querySelectorAll(".btn-dashboard-display-mode");
var action = "";
var value;

/**
 * Add change event listener on select action to get related inputs
 */
bulkUpdateActionSelect.addEventListener("change", function() {
    action = bulkUpdateActionSelect.value;
    appendDynamicForm(action);
    replaceSelectedCountVideos();
});

/**
 * Add click event listener on confirmation modal button to perform bulk update
 */
confirmBulkUpdateBtn.addEventListener("click", (e) => {
    e.preventDefault();
    bulk_update();
});

/**
 * Perform asynchronously bulk update on selected videos
 * @returns {Promise<void>}
 */
async function bulk_update() {

  // Init vars
  let formData = new FormData();
  let update_action = action === "delete" || action === "transcript" ? action : "fields" ;
  let update_fields = [];

  // Set updated field(s)
  if(update_action === "fields"){
      let form_groups = document.getElementById("dashboardForm").querySelectorAll(".form-group:not(.d-none)")
      Array.from(form_groups).forEach(form_group => {
          let element = form_group.querySelector(".form-control, .form-check-input, .form-select, input[name='thumbnail']");
          if(element.hasAttribute("multiple")){
            formData.append(element.getAttribute("name"), element.value);
          }else{
            value = element.type === "checkbox" ? element.checked : document.getElementById("id_"+element.getAttribute("name")).value;
            formData.append(element.getAttribute("name"), value);
          }
          update_fields.push(element.name);
      });
  }

  // Construct formData to send
  formData.append("selected_videos",JSON.stringify(getListSelectedVideos()));
  formData.append("update_fields",JSON.stringify(update_fields));
  formData.append("update_action",JSON.stringify(update_action));

  // Post asynchronous request
  let response = await fetch(urlUpdateVideos, {
    method: "POST",
    headers: {
      "X-Requested-With": "XMLHttpRequest",
      "X-CSRFToken": csrftoken,
    },
    body:formData,
  });
    let result = await response.text();
    // Close modal and scroll to top
    bootstrap.Modal.getInstance(document.getElementById('modalConfirmBulkUpdate')).toggle();
    window.scroll({top: 0, left: 0, behavior: 'smooth'});
    // Parse result
    data = JSON.parse(result);
    let message = data["message"];
    let updated_videos = data["updated_videos"];
    let deleted_videos = data["deleted_videos"];

    if(response.ok){
        // Set selected videos with new slugs if changed during update
        selectedVideos = updated_videos;
        showalert(message, "alert-success", "formalertdivbottomright");
        refreshVideosSearch();
    }else{
        // Manage field errors and global errors
        let errors = Array.from(data["fields_errors"]);
        if(errors.length > 0){
            errors.forEach((error) => {
                let key = Object.keys(error)[0];
                let element = document.getElementById("id_"+key);
                if(element != null){
                    let message = error[key];
                    showDashboardFormError(element, message, "alert-danger");
                }
            });
        }else{
            showalert(message, "alert-danger", "formalertdivbottomright");
        }
    }
}

/**
 * Dynamically display input(s) for selected action
 * @param action
 */
function appendDynamicForm(action){
    // Append form group selected action
    let elements = document.querySelectorAll('.fieldset-dashboard, .form-group-dashboard');
    Array.from(elements).forEach((form_group) => {
        form_group.classList.add("d-none");
    });
    if(formFieldsets.includes(action)){
        let fieldset = document.getElementById(action);
        fieldset.classList.remove("d-none");
        Array.from(fieldset.querySelectorAll(".form-group-dashboard")).forEach((form_group) => {
            form_group.classList.remove("d-none");
        });
    }else{
        let input = document.getElementById('id_'+action);
        if(input){
            input.closest(".form-group-dashboard").classList.remove("d-none");
        }
    }
}

/**
 * Change videos list display mode between "Grid" and "List"
 * @param display_mode
 */
function changeDisplayMode(display_mode){
    // Change display mode between grid and list
    displayMode = display_mode;
    btnDisplayMode.forEach(e => e.classList.toggle("active"));
    refreshVideosSearch();
}

/**
 * Update list of selected videos for modal confirm display
 */
function updateModalConfirmSelectedVideos(){
    let str = "";
    Array.from(selectedVideos).forEach((video) => {
        str += "<li>"+video.split('-')[1]+"</li>";
    });
    bulkUpdateConfirmSelectedVideos.innerHTML = str;
}

/**
 * Show feedback message after bulk update
 * @param message
 * @param alert_class
 */
function showDashboardFormError(element, message, alert_class){
    let html = "<div class=\"alert "+alert_class+" alert-dismissible fade show my-2\" role=\"alert\">"+message+
        "<button type=\"button\" class=\"btn-close\" data-bs-dismiss=\"alert\" aria-label=\"Close\"></button></div>"
    element.insertAdjacentHTML("beforebegin", html);
}
