const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
require("../models/Categoria");
const Categoria = mongoose.model("categorias");
require("../models/Postagem");
const Postagem = mongoose.model("postagens");
const {userAdmin} = require("../helpers/userAdmin");


router.get('/', (req, res) =>{
	res.render("admin/index");
});	

router.get('/categorias', userAdmin, (req, res) =>{
	Categoria.find().sort({date:'desc'}).then((categorias) => {
		res.render("admin/categorias", {categorias: categorias});
	}).catch((err) => {
		req.flash("error_msg", "Houve um erro ao listar as categorias"+err);
		res.redirect("/admin");
	});
});	

router.get('/categorias/add', userAdmin, (req, res) =>{
	res.render("admin/addcategoria");
});	

router.post('/categorias/nova', userAdmin, (req, res) => {
	var erros = [];

	//Validação
	if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null){
		erros.push({texto: "Nome Inválido"});
	}

	if(!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null){
		erros.push({texto: "Slug Inválido"});
	}

	if(req.body.nome.length < 2){
		erros.push({texto: "Nome da categoria é muito pequeno."});
	}

	if(erros.length > 0){
		res.render("admin/addcategoria", {erros: erros})
	}else{
		const novaCategoria = {
		nome: req.body.nome,
		slug: req.body.slug	
	}

		new Categoria(novaCategoria).save().then(() => {
			req.flash("success_msg", "Categoria criada com sucesso");
			res.redirect("/admin/categorias");
		}).catch((e) => {
			req.flash("error_msg", "Houve um erro ao criar categorias, por favor tente novamente");
			res.redirect("/admin");
		});
	}
});

router.get("/categorias/edit/:id", userAdmin, (req, res) => {
	Categoria.findOne({_id: req.params.id}).then((categorias) => {
		res.render("admin/editcategoria", {categorias: categorias});
	}).catch((erro) => {
		req.flash("error_msg", "Esta categoria não existe");
	});
});

router.post("/categorias/edit", userAdmin, (req, res) => {
	Categoria.findOne({_id: req.body.id}).then((categorias) => {
		categorias.nome = req.body.nome;
		categorias.slug = req.body.slug;

		categorias.save().then(() => {
			req.flash("success_msg", "Categoria editada com sucesso!");
			res.redirect("/admin/categorias");
		}).catch((erro) => {
			req.flash("error_msg", "Houve um erro interno ao editar categoria!");
			res.redirect("/admin/categorias");
		});	
	}).catch((erro) => {
		req.flash("error_msg", "Houve um erro ao editar categoria!"+erro);
		res.redirect("/admin/categorias");
	});
});


router.post("/categorias/delete", userAdmin, (req, res) => {
	Categoria.deleteOne({_id: req.body.id}).then(() => {
		req.flash("success_msg", "Categoria deletada com sucesso!");
		res.redirect("/admin/categorias");
	}).catch(() => {
		req.flash("error_msg", "Houve um erro ao deletar a categoria!");
		res.redirect("/admin/categorias");
	}).catch((erro) =>{
		req.flash("error_msg", "Houve um erro ao carregar as mensagens");
		res.redirect("/admin");
	});
});


router.get("/postagens", userAdmin, (req, res) => {
	Postagem.find().populate("categoria").sort({data:"desc"}).then((postagens) => {
		res.render("admin/postagens", {postagens:postagens});
	}).catch((erro) => {
		console.log(erro);
	});

	
});

router.get("/postagens/add", userAdmin, (req, res) => {
	Categoria.find().then((categorias) => {
		res.render("admin/addpostagem", {categorias:categorias});
	}).catch((erro) => {
		req.flash("error_msg", "Houve um erro ao criar postagem.");
		res.redirect("/admin");
	});
});

router.post("/postagens/nova", userAdmin, (req, res) => {
	var erros = [];

	if(req.body.categoria == 0){
		erros.push({texto: "Categoria inválida, registre uma categoria"});
	}

	if(erros.length > 0){
		res.render("admin/addpostagem", {erros:erros});
	}else{
		const novaPostagem = {
			titulo: req.body.titulo,
			descricao: req.body.descricao,
			conteudo: req.body.conteudo,
			categoria: req.body.categoria,
			slug: req.body.slug
		}

		new Postagem(novaPostagem).save().then(() => {
			req.flash("success_msg", "Postagem criada com sucesso!");
			res.redirect("/admin/postagens");
		}).catch((erro) => {
			req.flash("error_msg", "Houve um erro durante a criação da postagem");
			res.redirect("/admin/postagens");
		});
	}
});


router.get("/postagens/edit/:id", userAdmin, (req, res) => {
	Postagem.findOne({_id: req.params.id}).then((postagem) => {
		Categoria.find().then((categorias) => {
			res.render("admin/editpostagem", {categorias: categorias, postagem: postagem});
		}).catch((erro) => {
			req.flash("error_msg", "Houve um erro ao carregar categorias");
			console.log(erro);
			res.redirect("/admin/postagens");
		});
	}).catch((erro) =>{
		req.flash("error_msg", "Houve um erro ao carregar formulário");
		res.redirect("/admin/postagens");
	});	
});

router.post("/postagens/edit", userAdmin, (req, res) => {
	Postagem.findOne({_id: req.body.id}).then((postagem) => {
		postagem.titulo = req.body.titulo,
		postagem.slug = req.body.slug,
		postagem.descricao = req.body.descricao,
		postagem.conteudo = req.body.conteudo,
		postagem.categoria = req.body.categoria

		postagem.save().then(() => {
			req.flash("success_msg", "Postagem editada com sucesso!");
			res.redirect("/admin/postagens");
		}).catch((erro) => {
			req.flash("error_msg", "Erro interno");
			res.redirect("/admin/postagens");
		});
	}).catch((erro) => {
		req.flash("error_msg", "Ocorreu um erro durante a edição da postagem");
		res.redirect("/admin/postagens");
	});
});

// router.get("/postagens/deletar/:id", (req, res) => {
// 	Postagem.remove({_id: req.params.id}).then(() => {
// 		res.redirect("/admin/postagens");
// 	});
// });


router.post("/postagens/delete", userAdmin, (req, res) => {
	Postagem.deleteOne({_id: req.body.id}).then(() => {
		req.flash("success_msg", "Postagem deletada com sucesso!");
		res.redirect("/admin/postagens");
	}).catch(() => {
		req.flash("error_msg", "Houve um erro ao deletar a Postagem!");
		res.redirect("/admin/postagens");
	}).catch((erro) =>{
		req.flash("error_msg", "Houve um erro ao carregar as Postagens");
		res.redirect("/admin");
	});
});

module.exports = router;