const app = Sammy('#main', function () {
    const appKey='kid_S1FqgqWdZ';
    const appSecret='37b79545d10642f6805c6bee9f8eda30';
    const host='https://baas.kinvey.com';
    const AppHeaders={
        'Authorization' : 'Basic ' + btoa(appKey + ":" + appSecret)
    };
    function showInfo(message) {
        console.log($('#infoBox'));
        $('#infoBox').text(message);
        $('#infoBox').show();
        setTimeout(function() {
            $('#infoBox').fadeOut();
        }, 3000);
    }

    function showError(errorMsg) {
        $('#errorBox').text("Error: " + errorMsg);
        $('#errorBox').show();
    }
        function userHeaders() {
            return {
                'Authorization': 'Kinvey ' + sessionStorage.getItem('authtoken')
            }
        }
        this.use('Handlebars', 'hbr');
        this.get('index.html', function(ctx){
            ctx.loadPartials({
                header: './templates/common/header.hbr',
                footer: './templates/common/footer.hbr'
            }).then(function(){
                ctx.partials=this.partials;
                ctx.partial('./templates/home/home.hbr')
            });
        });
        this.get('#/register', function (ctx) {
           ctx.loadPartials({
               header: './templates/common/header.hbr',
               footer: './templates/common/footer.hbr',
               registerForm: './templates/register/registerForm.hbr'
           }).then(function () {
              ctx.partials=this.partials;

              ctx.partial('./templates/register/registerPage.hbr')
           });
        });
        this.post('#/register', function (ctx) {
            if($('#password').val()==$('#repeatPassword').val()) {
                $.ajax({
                    method: "POST",
                    url: `${host}/user/${appKey}`,
                    headers: AppHeaders,
                    data: {
                        username: $('#username').val(),
                        password: $('#password').val(),
                        teamId: ''
                    }
                }).then((response)=>{
                    handleResponse(response);
                    showInfo("Successfully registered!");
                }).catch((error)=>{
                    showError(error.responseJSON.description)
                })
            }
        });
    function handleResponse(response) {
        sessionStorage.setItem('authtoken', response._kmd.authtoken);
        sessionStorage.setItem('teamId', response.teamId);
        sessionStorage.setItem('userId', response._id);
        sessionStorage.setItem('username', response.username);
        window.location.hash='#/home';
    }
    this.get('#/login', function (ctx) {
        ctx.loadPartials({
            header: './templates/common/header.hbr',
            footer: './templates/common/footer.hbr',
            loginForm: './templates/login/loginForm.hbr'
        }).then(function () {
            ctx.username=sessionStorage.getItem('username');
            ctx.partials=this.partials;
            ctx.partial('./templates/login/loginPage.hbr')
        })
    });
    this.get('#/create', function (ctx) {

        ctx.loadPartials({
            header: './templates/common/header.hbr',
            footer: './templates/common/footer.hbr',
            createForm: './templates/create/createForm.hbr'
        }).then(function () {
            ctx.username=sessionStorage.getItem('username');
            if(sessionStorage.getItem('authtoken')){
                ctx.loggedIn=true;
            }
            ctx.partials=this.partials;
            ctx.partial('./templates/create/createPage.hbr');
        })
    });
    this.post('#/create', function () {
        $.ajax({
            method: "POST",
            url: `${host}/appdata/${appKey}/teams`,
            headers: userHeaders(),
            data: {
                name: $('#name').val(),
                description: $('#comment').val(),
            }
        }).then((response)=>{
            $.ajax({
                method: "PUT",
                headers: userHeaders(),
                url: `${host}/user/${appKey}/${sessionStorage.getItem('userId')}`,
                data:{
                    teamId: response._id
                }
            }).then((response)=>{
                sessionStorage.setItem('teamId', response._id);
                showInfo("Team created!");
                window.location.hash='#/catalog';

            });
        })
    });
    this.get('#/logout', function (ctx) {
       sessionStorage.clear();
        window.location.hash='#/home'
        showInfo("Logged out!");
    });
    this.get('#/catalog/:id', function (ctx) {
       console.log(ctx.params['id']);
       ctx.loadPartials({
           header: './templates/common/header.hbr',
           footer: './templates/common/footer.hbr',
           teamMember: './templates/catalog/teamMember.hbr',
           teamControls: './templates/catalog/teamControls.hbr'
       }).then(function () {
           ctx.username=sessionStorage.getItem('username');
           ctx.partials=this.partials;
           let id=ctx.params['id'].substr(1);
           $.ajax({
              method: "GET",
              url: `${host}/user/${appKey}/?query={"teamId":"${id}"}`,
              headers: userHeaders()
           }).then((members)=>{
               console.log(members);
               ctx.members=members;
           }).then(()=>{
               $.ajax({
               method: "GET",
               url: `${host}/appdata/${appKey}/teams/${id}`,
               headers: userHeaders()
               }).then((data)=>{

               if(sessionStorage.getItem('authtoken')){
                   if(sessionStorage.getItem('teamId')==id || sessionStorage.getItem('teamId')==""){
                       ctx.loggedIn=true
                   }
                   else{
                       ctx.loggedIn=false
                   }
               }

                   if(data._acl.creator==sessionStorage.getItem('userId') && sessionStorage.getItem('teamId')!=""){
                       ctx.isAuthor=true;
                       ctx.loggedIn=true;
                   }
               if(data._id==sessionStorage.getItem('teamId')){
                   ctx.isOnTeam=true;
               }

               ctx.name=data.name;
               ctx.comment=data.description;
               ctx.teamId=id;
               ctx.partial('./templates/catalog/details.hbr');
           })});

       })
    });
    this.get('#/catalog', function (ctx) {
        $.ajax({
           method: "GET",
           url: `${host}/appdata/${appKey}/teams`,
           headers: userHeaders()
       }).then((data)=>{
            ctx.loadPartials({
                header: './templates/common/header.hbr',
                footer: './templates/common/footer.hbr',
                team: './templates/catalog/team.hbr'
            }).then(function () {
                ctx.username=sessionStorage.getItem('username');
                ctx.teams=data;
                ctx.partials=this.partials;
                if(sessionStorage.getItem('authtoken')){
                    ctx.loggedIn=true;
                }
                if(sessionStorage.getItem('teamId')==""){
                    ctx.hasNoTeam=true;
                }
                ctx.partial('./templates/catalog/teamCatalog.hbr');
                showInfo("Teams loaded!");
            })
       })
    });
    this.get('#/leave/:id', function (ctx) {
        let id=ctx.params['id'].substr(1);
        console.log(id);
        $.ajax({
            method: "PUT",
            url: `${host}/user/${appKey}/${sessionStorage.getItem('userId')}`,
            headers: userHeaders(),
            data: {
                teamId: ""
            }
        }).then((response)=>{
            sessionStorage.setItem('teamId', "");
            window.location.hash=`#/catalog/:${id}`;
            showInfo("Team left!");
        })

    });
    this.get('#/about', function (ctx) {
       ctx.loadPartials({
           header: './templates/common/header.hbr',
           footer: './templates/common/footer.hbr',
       }).then(function () {
           ctx.username=sessionStorage.getItem('username');
           ctx.partials=this.partials;
           if(sessionStorage.getItem('authtoken')){
               ctx.loggedIn=true;
           }
           ctx.partial('./templates/about/about.hbr');
       })
    });
    this.post('#/login', function (ctx) {
        $.ajax({
            method: "POST",
            url: `${host}/user/${appKey}/login`,
            headers: AppHeaders,
            data: {
                username: $('#username').val(),
                password: $('#password').val(),
            }
        }).then((response)=>{
            handleResponse(response);
            showInfo("Logged in!");
        }).catch((response)=>{
            showError(response.responseJSON.description)
        })
    });
    this.get('#/home', function (ctx) {
        ctx.loadPartials({
            header: './templates/common/header.hbr',
            footer: './templates/common/footer.hbr',
        }).then(function () {
            ctx.username=sessionStorage.getItem('username');
            ctx.partials=this.partials;
            console.log(ctx.partials);
            if(sessionStorage.getItem('authtoken')){
                ctx.loggedIn=true;
            }
            if(sessionStorage.getItem('teamId')!="") {
                ctx.hasTeam=true;
                ctx.teamId=sessionStorage.getItem('teamId');
            }
            ctx.partial('./templates/home/home.hbr')
        });
    });
    this.get('#/join/:id', function (ctx) {
        let id=ctx.params['id'].substr(1);
        console.log(ctx.params['id'].substr(1));
        $.ajax({
            method: "PUT",
            url: `${host}/user/${appKey}/${sessionStorage.getItem('userId')}`,
            headers: userHeaders(),
            data:{
                teamId: id
            }
        }).then((data)=>{
            console.log(id);
            sessionStorage.setItem('teamId', data.teamId);
            showInfo("Successfully joined!");
            window.location.hash=`#/catalog/:${id}`;
        })
    });
    this.post('#/edit/:id', function (ctx) {
       let id=ctx.params['id'].substr(1);
        $.ajax({
            method: "PUT",
            url: `${host}/appdata/${appKey}/teams/${id}`,
            headers: userHeaders(),
            data: {
                name: $('#name').val(),
                description: $('#comment').val()
            }
        }).then((response)=>{
            showInfo("Successfully edited!");
            window.location.hash=`#/catalog`
        })
    });
    this.get('#/edit/:id', function (ctx) {
        let id=ctx.params['id'].substr(1);
        console.log(id);
        ctx.loadPartials({
            header: './templates/common/header.hbr',
            footer: './templates/common/footer.hbr',
            editForm: './templates/edit/editForm.hbr'
        }).then(function () {
            ctx.username=sessionStorage.getItem('username');
            ctx.partials=this.partials;
            $.ajax({
                method: "GET",
                url: `${host}/appdata/${appKey}/teams/${id}`,
                headers: userHeaders(),
            }).then((data)=>{
                console.log(data);
                ctx.teamId=data._id;
                ctx.name=data.name;
                ctx.comment=data.description;
                ctx.loggedIn=true;
                ctx.partial('./templates/edit/editPage.hbr');

            })
        })
    })
});
app.run();