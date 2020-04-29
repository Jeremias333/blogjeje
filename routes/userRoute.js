const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
require("../models/Usuario");
const Usuario = mongoose.model("usuarios");
const bcrypt = require("bcryptjs");
const passport = require("passport");

router.get("/registro", (req, res) => {
	res.render("usuarios/registro");
});

router.post("/registro", (req, res) => {
	var erros = [];

	if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null){
		erros.push({texto: "Nome inválido"});
	}

	if(!req.body.email || typeof req.body.email == undefined || req.body.email == null){
		erros.push({texto: "E-mail inválido"});
	}

	if(!req.body.senha || typeof req.body.senha == undefined || req.body.senha == null){
		erros.push({texto: "Senha inválida"});
	}

	if(req.body.senha.length < 6){
		erros.push({texto: "A senha deve ter ao menos 6 dígitos"});
	}

	if(req.body.senha != req.body.senha2){
		erros.push({texto: "Senhas não coincidem"});
	}

	if(erros.length > 0){
		res.render("usuarios/registro", {erros: erros});
	}else{
		//verificar se email já existe.
		Usuario.findOne({email: req.body.email}).then((usuario) => {
			if(usuario){
				req.flash("error_msg", "Já existe uma conta cadastrada com esse email em nosso sistema.");
				res.redirect("/user/registro");
			}else{
				//preencher objeto para então cadastrar;
				const novoUsuario = new Usuario({
					nome: req.body.nome,
					email: req.body.email,
					senha: req.body.senha
				});
				//encriptando senha;
				bcrypt.genSalt(10, (erro, salt) => {
					bcrypt.hash(novoUsuario.senha, salt, (erro, hash) => {
						if(erro){
							req.flash("error_msg", "Houve um erro durante o salvamento do usuário");
							res.redirect("/user/registro");
						}else{
							novoUsuario.senha = hash;
							novoUsuario.save().then(() => {
								req.flash("success_msg", "Usuario cadastrado com sucesso!");
								res.redirect("/")
							}).catch((erro) =>{
								console.log(erro);
								req.flash("error_msg", "Houve um erro ao cadastrar usuário ");
								res.redirect("/user/registro");
							});
						}
					});
				});
			}
		}).catch((erro) => {
			req.flash("error_msg", "Houve um erro ao interno");
		});
	}
});

router.get("/login", (req, res) => {
	res.render("usuarios/login");
});

router.post("/login", (req, res, next) => {
	passport.authenticate("local", {
		successRedirect: "/",
		failureRedirect: "/user/login",
		failureFlash: true
	})(req, res, next);

});

router.get("/logout", (req, res) => {
	req.logout();
	req.flash("success_msg", "Deslogado com sucesso!");
	res.redirect("/");
});

module.exports = router;