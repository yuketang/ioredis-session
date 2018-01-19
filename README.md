### ioredis-session
**Warning**: For internal use only!!! Rain-classroom ioredis-session only offers checkSession and dedroySession

```
var app = express()
app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'keyboard cat',
  name: 'SESSIONID',          //cookie name
  redis_conf: [],             //集群配置
  secrets: ['keyboard cat'],  //加密解密cookie
  cookie: cookie,             //其他cookie配置
  redirect: '/login',         //session类型，决定session验证失败时的操作：
                              //  redirect: 'wechat': 由服务器直接发起重定向到python端授权登录
                              //  redirect: '/login': session验证失败， 由服务器重定向到指定路径
                              //  redirect: undefinde:  session验证失败, 返回401
}))
```
