const Joi = require('joi');

const signupValidator = (data) => {
  const schema = Joi.object({
    username: Joi.string().min(3).max(30).required().messages({
      'string.min': "Le nom d'utilisateur doit contenir au moins 3 caractères",
      'string.max': "Le nom d'utilisateur doit contenir au maximum 30 caractères",
    }),
    email: Joi.string().email().required().messages({
      'string.email': "L'email n'est pas valide",
      'any.required': "L'email est obligatoire"
    }),
    password: Joi.string()
      .min(12)
      .pattern(new RegExp('^(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{12,}$'))
      .required()
      .messages({
        'string.pattern.base': "Le mot de passe doit contenir au moins 1 majuscule, 1 chiffre et 1 caractère spécial.",
        'string.min': "Le mot de passe doit contenir au moins 12 caractères."
      }),
    street: Joi.string().required().messages({
      'any.required': "La rue est obligatoire"
    }),
    zip: Joi.string().required().messages({
      'any.required': "Le code postal est obligatoire"
    }),
    city: Joi.string().required().messages({
      'any.required': "La ville est obligatoire"
    })

  });

  return schema.validate(data);
};

module.exports = { signupValidator };