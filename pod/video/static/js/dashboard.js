var bulkUpdateActionSelect = document.getElementById("bulkUpdateActionSelect");
var confirmBulkUpdateBtn = document.getElementById("confirmBulkUpdateBtn");
var action;
var value;

bulkUpdateActionSelect.addEventListener("change", function() {
    // Add event listener on change Action Select
    action = bulkUpdateActionSelect.value;
    appendDynamicForm(action);
});

async function bulk_update() {
  // Async POST request to bulk update videos
  let restrict_access_to_groups = document.getElementById("id_restrict_access_to_groups");
  if(restrict_access_to_groups != null &&
      Array.from(restrict_access_to_groups.querySelectorAll("option:checked")).length > 0){
      action = "restrict_access_to_groups";
  }
  let element = document.getElementById("id_"+action);
  if(element.hasAttribute("multiple")){
    value = Array.from(element.querySelectorAll("option:checked"),e => e.value);
  }else{
    value = element.type === "checkbox" ? element.checked : document.getElementById("id_"+action).value;
  }
  selectedVideosCards = getListSelectedVideos();

  let response = await fetch(urlVideos, {
    method: "POST",
    headers: {
      "X-Requested-With": "XMLHttpRequest",
      "X-CSRFToken": csrftoken,
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
        "selectedVideos" : selectedVideosCards,
        "action" : action,
        "value" : value
    })
  });
    let result = await response.text();
    if(response.ok){
        data = JSON.parse(result);
        Array.from(data["updated_videos"]).forEach((v_slug) => {
            selectedVideosCards.push(v_slug);
        });
        showalert(gettext("The changes have been saved."), "alert-success");
        refreshVideosSearch();
    }else{
        showalert(JSON.parse(result)["error"],"alert-danger");
    }
    bootstrap.Modal.getInstance(document.getElementById('modalConfirmBulkUpdate')).toggle();
}

function appendDynamicForm(action){
    // Append form group selected action
    let fieldsets = document.querySelectorAll('.fieldset-dashboard');
    let form_groups = document.querySelectorAll('.form-group-dashboard');
    Array.from(form_groups).forEach((form_group) => {
        form_group.classList.add("d-none");
    });
    fieldsets.forEach((fieldset) => fieldset.classList.add("d-none"));
    if(action === "channel_option" || action === "access_restrictions"){
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

confirmBulkUpdateBtn.addEventListener("click", (e) => {
    // Add event listener to perform bulk update after confirmation modal
    e.preventDefault();
    bulk_update();
});
