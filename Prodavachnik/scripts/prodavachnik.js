function startApp() {
    const appKey="kid_Sk7egm9Pb";
    const secret="916a44e1bad241fa9d470f02eec05d61";
    const host="https://baas.kinvey.com";

    const AppHeaders={
        'Authorization' : 'Basic ' + btoa(appKey + ":" + secret)
    };
    $(document).on({
        ajaxStart: function() { $("#loadingBox").show() },
        ajaxStop: function() { $("#loadingBox").hide() }
    });
    $("#infoBox, #errorBox").click(function() {
        $(this).fadeOut();
    });
    $('#menu').find('a').css('display', 'inline');
    showHideButtons();
    $('#linkHome').click(()=>{
        $.ajax({
            method:"GET",
            url:'home.html',
        }).then((data)=>{
            let template=Handlebars.compile(data);
            $('main').html(template({}));
        });
    });
    $('#linkLogin').click(()=>{
        $.ajax({
            method:"GET",
            url:'register.html',
        }).then((data)=>{
            let template=Handlebars.compile(data);
            $('main').html(template({type:"Please register here"}));
            $('#buttonRegisterUser').unbind("click");
            $('#buttonRegisterUser').click(login);
        });

    });
    $('#linkRegister').click(()=>{
        $.ajax({
            method:"GET",
            url:'register.html',
        }).then((data)=>{
            let template=Handlebars.compile(data);
            $('main').html(template({type:"Please register here"}));
            $('#buttonRegisterUser').unbind("click");
            $('#buttonRegisterUser').click(register);
        });
    });
    $('#linkListAds').click(async function () {
        $('main').find('section').hide();
        await listAds();
        showInfo("Ads loaded!");
    });
    $('#linkCreateAd').click(()=>{
        $.ajax({
            method:"GET",
            url:'create.html',
        }).then((data)=>{
            let template=Handlebars.compile(data);
            $('main').html(template({}));
            $('#buttonCreateAd').unbind("click");
            $('#buttonCreateAd').click(create);
        });
    });
    $('#linkLogout').click(()=>{
        sessionStorage.clear();
        $('#loggedInUser').text('');
        showHideButtons();
        $('main').find('section').hide();
        showInfo("Logged out!");
    });
    $('#buttonLoginUser').click(login);
    $('#buttonCreateAd').click(create);
    $('#buttonEditAd').click(edit);
    function showInfo(message) {

        $('#infoBox').text(message);
        $('#infoBox').show();
        setTimeout(function() {
            $('#infoBox').fadeOut();
        }, 1500);
    }
    function showError(errorMsg) {
        $('#errorBox').text("Error: " + errorMsg);
        $('#errorBox').show();
    }
    function create() {

        const createAdForm=$('#formCreateAd');
        $.ajax({
            method:"POST",
            url: `${host}/appdata/${appKey}/ads`,
            headers:userHeaders(),
            data:{
                title:$(createAdForm).find('input[name="title"]').val(),
                author: $(createAdForm).find('input[name="author"]').val(),
                description: $(createAdForm).find('textarea[name="description"]').val(),
                datePublished: $(createAdForm).find('input[name="datePublished"]').val(),
                price: $(createAdForm).find('input[name="price"]').val()
            },
            success:(response)=>{
                showInfo('Ad created!');
                listAds();
            },
            error:handleAjaxError
        })
    }
    function userHeaders() {
        return {
            'Authorization': 'Kinvey ' + sessionStorage.getItem('authToken')
        }
    }
    function listAds() {

        $.ajax({
            method:"GET",
            url:`${host}/appdata/${appKey}/ads`,
            headers:userHeaders(),
            error: handleAjaxError
        }).then((data)=>{
            ;
            const response=data;
            for(let i=0;i<response.length;i++){
                if(response[i]._acl.creator===sessionStorage['userId']) {
                    response[i].author=true;
                }
            }
            $.ajax({
                method:"GET",
                url:'listAds.html',
            }).then((data)=>{
                let template=Handlebars.compile(data);
                $('main').html(template({ad:response}));

                $('#ads').find('a:contains("[Delete]")').unbind("click");
                $('#ads').find('a:contains("[Edit]")').unbind("click");
                $('#ads').find('a:contains("[Delete]")').click(deleteAd);
                $('#ads').find('a:contains("[Edit]")').click(editAd);
            });

        });

    }
    function handleAjaxError(response) {
        let errorMsg = JSON.stringify(response);
        if (response.readyState === 0)
            errorMsg = "Cannot connect due to network error.";
        if (response.responseJSON &&
            response.responseJSON.description)
            errorMsg = response.responseJSON.description;
        showError(errorMsg);
    }
    function deleteAd(){

       $.ajax({
           method:"DELETE",
           url:`${host}/appdata/${appKey}/ads/${$(this).parent()[0].id}`,
           headers: userHeaders(),
           success: ()=>{
               showInfo("Ad deleted!");
               listAds();
           }
       })
    }
    function editAd(ad) {

        let childs=$(this).parent().parent().children();
        let context={
            title:$(childs[0]).text(),
            description:$(childs[1]).text(),
            datePublished: $(childs[2]).text(),
            price: $(childs[3]).text(),
            id: $(childs[4]).attr('id')
        };
        $.ajax({
            method:"GET",
            url:'edit.html',
        }).then((data)=> {
            let template = Handlebars.compile(data);
            $('main').html(template(context));
            $('#buttonEditAd').unbind('çlick');
            $('#buttonEditAd').click(edit);
        })
    }
    function edit() {
        let form=$('#formEditAd');
        $.ajax({
            url:`${host}/appdata/${appKey}/ads/${$(form).find('input[name="id"]').val()}`,
            method:"PUT",
            headers: userHeaders(),
            data:{
                title: form.find('input[name="title"]').val(),
                description:form.find('textarea').val(),
                datePublished:form.find('input[name="datePublished"]').val(),
                price:form.find('input[name="price"]').val()
            },
            success: ()=>{
                $('main').find('section').hide();
                showInfo("Ad edited!");
                listAds();
                //showInfo("Book successful edited!");
            },
            error: handleAjaxError
        })
    }
    function login() {
        $.ajax({
            method:"POST",
            url:`${host}/user/${appKey}/login`,
            headers: AppHeaders,
            data: {
                username: $('#formRegister').find('input[name="username"]').val(),
                password: $('#formRegister').find('input[name="passwd"]').val()
            },
            success:(response)=>{
                showInfo("Logged in!");
                handleResponse(response);
            },
            error:handleAjaxError
        })
    }
    function register(event) {

        $.ajax({
            method:"POST",
            url:`${host}/user/${appKey}`,
            headers: AppHeaders,
            data: {
                username: $('#formRegister').find('input[name="username"]').val(),
                password: $('#formRegister').find('input[name="passwd"]').val()
            },
            success:(response)=>{
                $('main').find('section').hide();
                showInfo('Registration successful!');
                handleResponse(response);
            },
            error:handleAjaxError
        })
    }
    function handleResponse(response) {
        sessionStorage.setItem('authToken', response._kmd.authtoken);
        sessionStorage.setItem('userId', response._id);
        showHideButtons();
        $('#loggedInUser').text(`Welcome, ${response.username}!`);
        $('#loggedInUser').css('display' , 'inline');
        listAds();
    }
    function showHideButtons() {
        $('#linkHome').show();
        if(sessionStorage.getItem('authToken')){
            $('#linkLogin').hide();
            $('#linkRegister').hide();
            $('#linkListAds').show();
            $('#linkCreateAd').show();
            $('#linkLogout').show();
        }
        else{
            $('#linkLogin').show();
            $('#linkRegister').show();
            $('#linkListAds').hide();
            $('#linkCreateAd').hide();
            $('#linkLogout').hide();
        }
    }
}
