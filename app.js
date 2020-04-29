//CARREGANDO MÓDULOS.
const express = require("express");
const handlebars = require("express-handlebars");
const bodyParser = require("body-parser");
const mongoose = require("mongoose")
const path = require("path");
const session = require("express-session");
const flash = require("connect-flash");
const app = express();
const adminRoute = require("./routes/adminRoute");
const userRoute = require("./routes/userRoute");
const passport = require("passport");
require("./config/auth")(passport);

//CONFIGURAÇÕES.
app.use(bodyParser.urlencoded({extended: 'main'}));
app.use(bodyParser.json());

app.engine('handlebars', handlebars({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
	//PUBLIC 
	app.use(express.static(path.join(__dirname, "public")));
//SESSÃO
app.use(session({
	secret: 'teste',
	resave: false,
	saveUninitialized:true	
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

//Middleware
app.use((req, res, next) => {
	res.locals.success_msg = req.flash("success_msg");
	res.locals.error_msg = req.flash("error_msg");
	res.locals.error = req.flash("error");
	res.locals.user = req.user || null;
	next();
}); 

//CONECTANDO COM O BANCO
mongoose.Promise = global.Promise;
mongoose.connect('mongodb+srv://jere:123@base01-jln06.gcp.mongodb.net/test?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true})
.then(() => {
	console.log("Conectado com sucesso no mongoDB");
})
.catch((e) => {
	console.log("Erro ao conectar "+ e);
});

//CARREGANDO MODELS
require("./models/Categoria");
const Categoria = mongoose.model("categorias");
require("./models/Postagem");
const Postagem = mongoose.model("postagens");

//ROTAS.
app.get('/', (req, res) => {
	Postagem.find().populate("categoria").sort({data:"desc"}).then((postagens) => {
		res.render("index", {postagens: postagens, data: new Date()});

	}).catch((erro) => {
		req.flash("error_msg", "Houve um erro interno");
		res.redirect("/404");
	});
});

app.get("/postagem/:slug", (req, res) => {
	Postagem.findOne({slug: req.params.slug}).then((postagem) => {
		if(postagem){
			res.render("postagem/index", {postagem: postagem, data: new Date()});
		}else{--
			req.flash("error_msg", "Esta postagem não existe");
			redirect("/");
		}
	}).catch((erro) => {
		req.flash("error_msg", "Houve um erro interno")
	});

});

app.get("/404", (req, res) => {
	res.send("Erro 404.");
});

app.get("/categorias", (req, res) => {
	Categoria.find().then((categorias) => {
		res.render("categorias/index", {categorias: categorias});
	}).catch((erro) => {
		req.flash("error_msg", "Houve um erro interno ao listar as categorias.")
	});
});

app.get("/categorias/:slug", (req, res) => {
	Categoria.findOne({slug: req.params.slug}).then((categorias) => {
		if (categorias){
			Postagem.find({categoria: categorias._id}).then((postagens) => {
				res.render("categorias/postagens", {postagens: postagens, categorias: categorias});
			}).catch((erro) => {
				req.flash("error_msg", "Houve um erro ao redenrizar os posts "+erro);
				res.redirect("/");
			});
		}else{
			req.flash("error_msg", "Esta categoria não existe");
			res.redirect("/");
		}
	}).catch((erro) => {
		req.flash("error_msg", "Houve um erro interno ao carregar a página desta categoria");
		res.redirect("/");
	});
});

app.use('/admin', adminRoute);
app.use('/user', userRoute);
//OUTROS.
const PORT = process.env.PORT || 8081;

app.listen(PORT, () =>{
	console.log("Servidor rodando!");
});