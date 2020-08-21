const inquirer = require('inquirer')
const fs = require('fs-extra')
const animals = require('ascii-animals')
const TargetServer = require('../lib/apigee/targetserver')
const Kvm = require('../lib/apigee/kvm')
const SwaggerHelper = require('../helper/swagger')
const ProxyHelper = require('../helper/proxy')
const PostmanHelper = require('../helper/postman')

class DefaultQuestions {
  constructor (request, config) {
    this.user = config.user
    this.org = config.org
    this.env = config.env ? config.env.split(',') : config.env
    this.targetserver = new TargetServer(request)
    this.kvmModel = new Kvm(request)
  }

  askQuestions () {
    return this.first()
  }

  async first () {
    const questions = [
      {
        type: 'list',
        name: 'create',
        message: 'What do you want to create?',
        choices: [{
          name: 'All of the below!',
          value: () => this.all()
        }, {
          name: 'Target Server',
          value: () => this.targetServer()
        }, {
          name: 'Swagger file',
          value: () => this.swagger()
        }, {
          name: 'Api proxy',
          value: () => this.apiProxy()
        }, {
          name: 'Postman test collection',
          value: () => this.postman()
        }, {
          name: 'config.json',
          value: () => this.config()
        }, {
          name: 'KVM',
          value: () => this.kvm()
        }, {
          name: 'I just want to see a random animal',
          value: () => this.animal()
        }]
      }
    ]
    const answers = await inquirer.prompt(questions)
    return answers.create()
  }

  async all () {
    if (!await fs.pathExists('swagger-backend.json')) {
      throw new Error('Please make sure a swagger-backend.json file exists in the current folder')
    }
    if (!await fs.pathExists('../skeleton')) {
      throw new Error('Please make sure a skeleton folder exists in the parent folder')
    }
    console.log(`Alright, we'll start with creating a target server`)
    const targetServerAnswers = await this.targetServer()
    const answers = await inquirer.prompt([{
      name: 'createKvm',
      type: 'confirm',
      message: 'Nice, next! Do you want to create a KVM?',
      default: false
    }])
    if (answers.createKvm) {
      await this.kvm()
    }
    console.log(`Let's move on to creating the swagger!`)
    await this.swagger()
    console.log(`This is going so smooth. Now let's create a config.json file.`)
    await this.config()
    console.log(`Okay, we will now create a postman collection`)
    await this.postman()
    console.log(`Last but definitely not least, the api proxy!`)
    await this.apiProxy(targetServerAnswers.name)
    this.animal()
  }

  async targetServer () {
    let questions = [
      {
        name: 'name',
        type: 'input',
        message: 'What is the name of the target server?'
      }
    ]
    questions = [...questions, ...this.env.map(env => {
      return {
        name: env,
        type: 'input',
        message: `What is the hostname for ${env}?`
      }
    })]
    const answers = await inquirer.prompt(questions)
    await Promise.all(this.env.map(async env => {
      const ts = await this.targetserver.detail(this.org, env, answers.name)
      if (!ts) {
        return env
      }
      if (ts.host === answers[env]) {
        return false
      }
      throw new Error(`Target server for environment '${env}' does not equal '${answers[env]}'`)
    })).then(environments => environments.filter(env => env !== false).map(env => this.targetserver.add(this.org, env, {
      'name': answers.name,
      'host': answers[env],
      'isEnabled': true,
      'port': 443
    })))
    return answers
  }

  async swagger () {
    let questions = [
      {
        name: 'resource',
        type: 'input',
        message: 'What is the name of the resource?',
        default: ''
      },
      {
        name: 'version',
        type: 'input',
        message: 'What is the version of the resource?',
        default: '1'
      }
    ]
    const answers = await inquirer.prompt(questions)
    let swaggerBackend
    try {
      swaggerBackend = fs.readFileSync('swagger-backend.json', 'utf8')
    } catch (e) {
      throw new Error(`Please make sure a file called 'swagger-backend.json' exists in the current directory`)
    }
    const parsed = JSON.parse(swaggerBackend)
    const swaggerHelper = new SwaggerHelper(parsed)
    swaggerHelper.modify(answers.resource, answers.version)
    return answers
  }

  async apiProxy (target) {
    let questions = [
      {
        name: 'description',
        type: 'input',
        message: 'What is the description of the proxy?'
      },
      {
        name: 'audience',
        type: 'input',
        message: 'What is the name of the AD audience Key value map?',
        default: 'Apigee-AD-Audience'
      }
    ]
    if (!target) {
      questions.push({
        name: 'target',
        type: 'input',
        message: 'What is the name of the TargetServer?'
      })
    }
    const answers = await inquirer.prompt(questions)
    const proxy = new ProxyHelper()
    answers.target = target || answers.target
    proxy.parse(answers)
    return answers
  }

  postman () {
    const postmanHelper = new PostmanHelper()
    return postmanHelper.start()
  }

  async config () {
    let questions = [
      {
        name: 'quota',
        type: 'input',
        message: 'What is the default quota for this proxy?',
        default: '10000'
      },
      {
        name: 'isSame',
        type: 'confirm',
        message: 'Is this the same for all environments?',
        default: true
      }
    ]
    const answers = await inquirer.prompt(questions)
    const config = {
      dev: {quota: answers.quota},
      test: {quota: answers.quota},
      acc: {quota: answers.quota},
      prod: {quota: answers.quota},
      default: {quota: answers.quota}
    }
    if (!answers.isSame) {
      let questions = [
        {
          name: 'dev',
          type: 'input',
          message: 'What is the quota for dev?',
          default: answers.quota
        },
        {
          name: 'test',
          type: 'input',
          message: 'What is the quota for test?',
          default: answers.quota
        },
        {
          name: 'acc',
          type: 'input',
          message: 'What is the quota for acc?',
          default: answers.quota
        },
        {
          name: 'prod',
          type: 'input',
          message: 'What is the quota for prod?',
          default: answers.quota
        }
      ]
      const allAnswers = await inquirer.prompt(questions)
      config.dev.quota = allAnswers.dev
      config.test.quota = allAnswers.test
      config.acc.quota = allAnswers.acc
      config.prod.quota = allAnswers.prod
    }
    fs.writeFileSync('config.json', JSON.stringify(config, null, 2), 'utf8')
  }

  async kvm () {
    let questions = [
      {
        name: 'name',
        type: 'input',
        message: 'What is the name of the KVM you want to create?'
      },
      {
        name: 'encrypted',
        type: 'confirm',
        message: 'Is it encrypted?',
        default: false
      },
      {
        name: 'keys',
        type: 'input',
        message: 'Enter a comma seperated list of keys',
        default: 'key1, key2'
      }
    ]
    const answers = await inquirer.prompt(questions)
    const keys = answers.keys.replace(' ', '').split(',')

    const values = this.env.map(env => {
      return keys.map(key => {
        return {
          name: `${env}-${key}`,
          type: 'input',
          message: `What is the value for ${key} on ${env}?`
        }
      })
    }).flat()

    const allValues = await inquirer.prompt(values)
    const splitValues = Object.keys(allValues).map(key => {
      return {
        env: key.split('-')[0],
        key: key.split('-')[1],
        value: allValues[key]
      }
    })
    console.table(`Okay, i'm about to create an ${answers.encrypted ? 'encrypted' : 'unencrypted'} KVM called: ${answers.name} with these values:`, splitValues)
    const correct = await inquirer.prompt([{
      name: 'isCorrect',
      type: 'confirm',
      message: 'Is this correct?',
      default: true
    }])
    if (correct.isCorrect) {
      return this.env.map(env => {
        const kvm = {
          name: answers.name,
          encrypted: answers.encrypted,
          entry: splitValues.filter(val => val.env === env).map(val => {
            return {
              name: val.key,
              value: val.value
            }
          })
        }
        this.kvmModel.add(this.org, env, kvm)
      })
    } else {
      return this.kvm()
    }
  }

  animal () {
    const supportedAnimals = ['cat', 'cat_moon', 'dog', 'dog_surprise', 'snake', 'snail', 'lion_head']
    const randomAnimal = supportedAnimals[Math.floor(Math.random() * supportedAnimals.length)]
    animals.drawAnimal(randomAnimal)
  }
}
module.exports = DefaultQuestions
