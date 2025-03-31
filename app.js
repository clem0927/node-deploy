const express=require('express');
const cookieParser=require('cookie-parser');
const morgan=require('morgan');
const path=require('path');
const session=require('express-session');
const nunjucks=require('nunjucks');
const dotenv=require('dotenv'); //dotenv=> .env파일읽어 process.env로 만듦(키를 보안파일로 보호).
const passport=require('passport');
const helmet=require('helmet');
const hpp=require('hpp');
const redis=require('redis');
const RedisStore=require('connect-redis').default
const logger=require('./logger');


dotenv.config();
const redisClient=redis.createClient({
    url:`redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    password:process.env.REDIS_PASSWORD,
});
redisClient.connect().catch(console.error);
const pageRouter=require('./routes/page');
const authRouter=require('./routes/auth');
const postRouter=require('./routes/post');
const userRouter=require('./routes/user');
const { sequelize } = require('./models');
const passportConfig=require('./passport');

const app=express();
passportConfig();
app.set('port',process.env.PORT||8001);//포트 설정 8001
app.set('view engine','html') ;//views폴더내 html들을 render로 접근가능
nunjucks.configure('views',{
    express:app,
    watch:true,
});

sequelize.sync({force:false})
    .then(()=>{
        console.log('데이터베이스 연결 성공');
    })
    .catch((err)=>{
        console.error(err);
    });
//미들웨어:요청과 응답의 중간(middle)로 주소넣어주면 주소요청에서 실행 아니면 모든 요청에서 실행!
//매개변수 없는애들은 내부적으로 next호출!

if(process.env.NODE_ENV==='production'){
    app.use(morgan('combined'));//배포용일시 combined
    app.use(
        helmet({
            contentSecurityPolicy:false,
            crossOriginEmbedderPolicy:false,
            crossOriginResourcePolicy:false,
        })
    );
    app.use(hpp());
}else{
    app.use(morgan('dev'));//개발용일시 dev
}


app.use(express.static(path.join(__dirname,'public'))); //~public폴더를 그냥 접근가능하게됨.

app.use('/img',express.static(path.join(__dirname,'uploads'))); //upload폴더를 /img로 접근가능하게됨.

app.use(express.json());//body parser로 본문내용 req.body로 만듦.
app.use(express.urlencoded({extended:false}));

app.use(cookieParser(process.env.COOKIE_SECRET));//cookie parser는 쿠키해석해 req.cookies 객체 만듦.

const sessionOption={
    resave:false,
    saveUnitialized:false,
    secret:process.env.COOKIE_SECRET,
    cookie:{
        httpOnly:true,
        secure:false,
    },
    store:new RedisStore({client:redisClient}),
};
if(process.env.NODE_ENV==='production'){
    sessionOption.proxy=true;
}
app.use(session(sessionOption));
app.use(passport.initialize());
app.use(passport.session());

app.use('/',pageRouter);
app.use('/auth',authRouter);
app.use('/post',postRouter);
app.use('/user',userRouter);

app.use((req,res,next)=>{
    const error=new Error(`${req.method} ${req.url}라우터가 없습니다.`);
    error.status=404;
    logger.info('hello');
    logger.error(error.message);
    next(error);
});
//에러처리 라우터는 매개변수가 err,req,res,next로 네개
app.use((err,req,res,next)=>{
    res.locals.message=err.message;
    res.locals.error=process.env.NODE_ENV!=='production'?err:{};
    res.status(err.status || 500);
    res.render('error');
});
app.use((req, res, next) => {
    console.log('Logged in user:', req.user);  // 로그인 후 사용자 정보 확인
    next();
  });


module.exports=app;