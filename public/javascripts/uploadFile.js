const imagePreview = document.getElementById('image_preview');
const select_file = document.getElementById('select_file');

select_file.onchange = function (ev) {
    const photo = ev.target.files[0];
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('photo', photo);

    xhr.open('POST', window.location.origin + '/api/note/attachment/add');
    xhr.onload = function () {
        if (xhr.status < 300) {
            imagePreview.src = JSON.parse(xhr.response).secure_url;
        } else {
            alert('Could not upload file.');
        }
    };
    xhr.send(formData);
};