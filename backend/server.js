
# إنشاء جميع ملفات المشروع

server_js = '''/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    Yasmin Hub - Payment Server                           ║
 * ║         خادم الدفع المتكامل مع بوابات الدفع المصرية المرخصة              ║
 * ║                                                                          ║
 * ║  المميزات:                                                               ║
 * ║  • Express.js + MongoDB (Mongoose)                                       ║
 * ║  • مصادقة JWT كاملة                                                      ║
 * ║  • تكامل Paymob + Fawry + InstaPay + Vodafone Cash                       ║
 * ║  • Webhooks آمنة مع توقيع HMAC                                           ║
 * ║  • نظام KYC متعدد المستويات                                              ║
 * ║  • Rate Limiting + CORS + Helmet                                         ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

// ═══════════════════════════════════════════════════════════════════════════
// استيراد خدمات الدفع
// ═══════════════════════════════════════════════════════════════════════════
const PaymobService = require('./backend/api/paymob');
const FawryService = require('./backend/api/fawry');
const InstaPayService = require('./backend/api/instapay');
const VodafoneCashService = require('./backend/api/vodafone-cash');

const paymob = new PaymobService();
const fawry = new FawryService();
const instapay = new InstaPayService();
const vodafoneCash = new VodafoneCashService();

// ═══════════════════════════════════════════════════════════════════════════
// إنشاء التطبيق
// ═══════════════════════════════════════════════════════════════════════════
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'yasmin-hub-secret-key-change-in-production';

// ═══════════════════════════════════════════════════════════════════════════
// Middlewares - طبقات الأمان
// ═══════════════════════════════════════════════════════════════════════════
app.use(helmet()); // حماية HTTP headers
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined')); // تسجيل الطلبات

// Rate Limiting - حماية من الهجمات
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 100, // 100 طلب لكل IP
    message: { error: 'تم تجاوز الحد المسموح به من الطلبات. حاول لاحقاً.' }
});
app.use('/api/', limiter);

// Rate Limiting خاص بالمدفوعات (أكثر صرامة)
const paymentLimiter = rateLimit({
    windowMs: 60 * 1000, // دقيقة واحدة
    max: 5, // 5 محاولات فقط
    message: { error: 'تم تجاوز محاولات الدفع. حاول بعد دقيقة.' }
});

// ═══════════════════════════════════════════════════════════════════════════
// اتصال MongoDB
// ═══════════════════════════════════════════════════════════════════════════
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yasmin_hub', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ متصل بقاعدة البيانات MongoDB'))
.catch(err => console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err));

// ═══════════════════════════════════════════════════════════════════════════
// نماذج قاعدة البيانات (Models)
// ═══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────
// نموذج المستخدم
// ─────────────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true,
        trim: true
    },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },
    nationalId: { type: String, required: true, unique: true },
    
    // KYC Levels
    kycLevel: { 
        type: Number, 
        default: 0, 
        enum: [0, 1, 2, 3] 
    },
    kycVerified: { type: Boolean, default: false },
    kycDocuments: [{
        type: { type: String, enum: ['national_id', 'selfie', 'address_proof', 'commercial_register'] },
        url: String,
        verified: { type: Boolean, default: false },
        uploadedAt: { type: Date, default: Date.now }
    }],
    
    // حالة الحساب
    status: { 
        type: String, 
        default: 'active', 
        enum: ['active', 'suspended', 'frozen', 'banned'] 
    },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// ─────────────────────────────────────────────────────────────────────────
// نموذج المحفظة
// ─────────────────────────────────────────────────────────────────────────
const walletSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    balance: { type: Number, default: 0 }, // بالقروش (EGP * 100)
    currency: { type: String, default: 'EGP' },
    status: { 
        type: String, 
        default: 'active', 
        enum: ['active', 'frozen', 'suspended'] 
    },
    dailyLimit: { type: Number, default: 5000000 }, // 50,000 EGP (بالقروش)
    monthlyLimit: { type: Number, default: 50000000 }, // 500,000 EGP
    totalDeposits: { type: Number, default: 0 },
    totalWithdrawals: { type: Number, default: 0 },
    lastTransactionAt: Date,
    createdAt: { type: Date, default: Date.now }
});

const Wallet = mongoose.model('Wallet', walletSchema);

// ─────────────────────────────────────────────────────────────────────────
// نموذج المعاملة
// ─────────────────────────────────────────────────────────────────────────
const transactionSchema = new mongoose.Schema({
    transactionId: { 
        type: String, 
        required: true, 
        unique: true 
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', required: true },
    
    type: { 
        type: String, 
        required: true, 
        enum: ['deposit', 'withdrawal', 'transfer', 'refund', 'fee'] 
    },
    
    amount: { type: Number, required: true }, // بالقروش
    currency: { type: String, default: 'EGP' },
    fee: { type: Number, default: 0 },
    netAmount: { type: Number, required: true }, // amount - fee
    
    // بوابة الدفع
    gateway: { 
        type: String, 
        required: true, 
        enum: ['paymob', 'fawry', 'instapay', 'vodafone_cash', 'internal'] 
    },
    gatewayTransactionId: String,
    gatewayReference: String,
    
    // تفاصيل الدفع
    paymentMethod: { 
        type: String, 
        enum: ['card', 'wallet', 'reference', 'bank_transfer', 'instapay'] 
    },
    paymentDetails: {
        cardLastFour: String,
        walletProvider: String, // vodafone, etisalat, orange, we
        phoneNumber: String,
        bankName: String,
        accountNumber: String,
        referenceNumber: String
    },
    
    // الحالة
    status: { 
        type: String, 
        default: 'pending', 
        enum: ['pending', 'processing', 'completed', 'failed', 'reversed', 'cancelled'] 
    },
    
    // Metadata
    description: String,
    metadata: mongoose.Schema.Types.Mixed,
    
    // توقيتات
    createdAt: { type: Date, default: Date.now },
    completedAt: Date,
    failedAt: Date,
    reversedAt: Date
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// ═══════════════════════════════════════════════════════════════════════════
// Middleware - المصادقة
// ═══════════════════════════════════════════════════════════════════════════

const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user || user.status !== 'active') {
            return res.status(401).json({ error: 'الحساب غير نشط' });
        }
        
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'رمز المصادقة غير صالح' });
    }
};

const requireKYC = (level = 1) => {
    return (req, res, next) => {
        if (req.user.kycLevel < level) {
            return res.status(403).json({ 
                error: `يتطلب مستوى KYC ${level} أو أعلى`,
                currentLevel: req.user.kycLevel,
                requiredLevel: level
            });
        }
        next();
    };
};

// ═══════════════════════════════════════════════════════════════════════════
// Routes - المصادقة
// ═══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────
// تسجيل مستخدم جديد
// ─────────────────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone, nationalId } = req.body;
        
        // التحقق من البيانات
        if (!email || !password || !firstName || !lastName || !phone || !nationalId) {
            return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
        }
        
        // التحقق من صحة البريد
        const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'بريد إلكتروني غير صالح' });
        }
        
        // التحقق من صحة الهاتف المصري
        const phoneRegex = /^(01)[0-2,5]{1}[0-9]{8}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({ error: 'رقم هاتف مصري غير صالح' });
        }
        
        // التحقق من الرقم القومي
        const nationalIdRegex = /^[2-3]{1}[0-9]{13}$/;
        if (!nationalIdRegex.test(nationalId)) {
            return res.status(400).json({ error: 'رقم قومي غير صالح' });
        }
        
        // التحقق من عدم التكرار
        const existingUser = await User.findOne({ $or: [{ email }, { nationalId }, { phone }] });
        if (existingUser) {
            return res.status(409).json({ error: 'المستخدم موجود بالفعل' });
        }
        
        // إنشاء المستخدم
        const user = new User({ email, password, firstName, lastName, phone, nationalId });
        await user.save();
        
        // إنشاء المحفظة
        const wallet = new Wallet({ userId: user._id });
        await wallet.save();
        
        // إنشاء التوكن
        const token = jwt.sign(
            { userId: user._id, email: user.email, kycLevel: user.kycLevel },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.status(201).json({
            success: true,
            message: 'تم إنشاء الحساب بنجاح',
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                kycLevel: user.kycLevel,
                kycVerified: user.kycVerified
            }
        });
        
    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// ─────────────────────────────────────────────────────────────────────────
// تسجيل الدخول
// ─────────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
        }
        
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
        }
        
        if (user.status !== 'active') {
            return res.status(403).json({ error: 'الحساب معطل. تواصل مع الدعم.' });
        }
        
        const token = jwt.sign(
            { userId: user._id, email: user.email, kycLevel: user.kycLevel },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                kycLevel: user.kycLevel,
                kycVerified: user.kycVerified
            }
        });
        
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// ─────────────────────────────────────────────────────────────────────────
// الحصول على بيانات المستخدم
// ─────────────────────────────────────────────────────────────────────────
app.get('/api/auth/me', authenticate, async (req, res) => {
    try {
        const wallet = await Wallet.findOne({ userId: req.user._id });
        
        res.json({
            user: {
                id: req.user._id,
                email: req.user.email,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                phone: req.user.phone,
                kycLevel: req.user.kycLevel,
                kycVerified: req.user.kycVerified,
                status: req.user.status
            },
            wallet: wallet ? {
                balance: wallet.balance / 100,
                currency: wallet.currency,
                status: wallet.status,
                dailyLimit: wallet.dailyLimit / 100,
                monthlyLimit: wallet.monthlyLimit / 100
            } : null
        });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// Routes - المحفظة
// ═══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────
// الحصول على رصيد المحفظة
// ─────────────────────────────────────────────────────────────────────────
app.get('/api/wallet/balance', authenticate, async (req, res) => {
    try {
        const wallet = await Wallet.findOne({ userId: req.user._id });
        
        if (!wallet) {
            return res.status(404).json({ error: 'المحفظة غير موجودة' });
        }
        
        res.json({
            balance: wallet.balance / 100,
            currency: wallet.currency,
            status: wallet.status,
            dailyLimit: wallet.dailyLimit / 100,
            monthlyLimit: wallet.monthlyLimit / 100,
            totalDeposits: wallet.totalDeposits / 100,
            totalWithdrawals: wallet.totalWithdrawals / 100
        });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// ─────────────────────────────────────────────────────────────────────────
// سجل المعاملات
// ─────────────────────────────────────────────────────────────────────────
app.get('/api/wallet/transactions', authenticate, async (req, res) => {
    try {
        const { page = 1, limit = 20, type, status } = req.query;
        const wallet = await Wallet.findOne({ userId: req.user._id });
        
        const query = { walletId: wallet._id };
        if (type) query.type = type;
        if (status) query.status = status;
        
        const transactions = await Transaction.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        
        const total = await Transaction.countDocuments(query);
        
        res.json({
            transactions: transactions.map(t => ({
                id: t._id,
                transactionId: t.transactionId,
                type: t.type,
                amount: t.amount / 100,
                fee: t.fee / 100,
                netAmount: t.netAmount / 100,
                status: t.status,
                gateway: t.gateway,
                paymentMethod: t.paymentMethod,
                description: t.description,
                createdAt: t.createdAt,
                completedAt: t.completedAt
            })),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// Routes - الدفع عبر Paymob
// ═══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────
// إنشاء طلب دفع عبر Paymob (بطاقة / محفظة)
// ─────────────────────────────────────────────────────────────────────────
app.post('/api/payments/paymob/initiate', authenticate, paymentLimiter, async (req, res) => {
    try {
        const { amount, paymentMethod = 'card', items = [] } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'المبلغ غير صالح' });
        }
        
        const wallet = await Wallet.findOne({ userId: req.user._id });
        
        // التحقق من KYC للمبالغ الكبيرة
        if (amount > 10000 && req.user.kycLevel < 1) {
            return res.status(403).json({ 
                error: 'المبالغ أكبر من 10,000 EGP تتطلب التحقق من الهوية (KYC Level 1)'
            });
        }
        
        // إنشاء معاملة
        const transaction = new Transaction({
            transactionId: `TXN-PAYMOB-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            userId: req.user._id,
            walletId: wallet._id,
            type: 'deposit',
            amount: amount * 100,
            currency: 'EGP',
            fee: 0,
            netAmount: amount * 100,
            gateway: 'paymob',
            paymentMethod: paymentMethod === 'wallet' ? 'wallet' : 'card',
            status: 'pending',
            description: 'إيداع عبر Paymob'
        });
        await transaction.save();
        
        // بيانات الفوترة
        const billingData = {
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            email: req.user.email,
            phone: req.user.phone,
            apartment: 'NA',
            floor: 'NA',
            street: 'NA',
            building: 'NA',
            city: 'Cairo',
            country: 'EG',
            state: 'Cairo',
            postalCode: 'NA'
        };
        
        // إنشاء الدفع
        const result = await paymob.processPayment(amount, billingData, paymentMethod);
        
        if (!result.success) {
            transaction.status = 'failed';
            await transaction.save();
            return res.status(400).json({ error: result.error });
        }
        
        // تحديث المعاملة
        transaction.gatewayTransactionId = result.orderId;
        await transaction.save();
        
        res.json({
            success: true,
            transactionId: transaction.transactionId,
            orderId: result.orderId,
            paymentKey: result.paymentKey,
            iframeUrl: result.iframeUrl,
            message: paymentMethod === 'wallet' 
                ? 'سيتم إرسال OTP إلى هاتفك للتأكيد'
                : 'استخدم iframe لإكمال الدفع'
        });
        
    } catch (error) {
        console.error('Paymob Initiate Error:', error);
        res.status(500).json({ error: 'فشل إنشاء طلب الدفع' });
    }
});

// ─────────────────────────────────────────────────────────────────────────
// Webhook - Paymob (معالجة نتيجة الدفع)
// ─────────────────────────────────────────────────────────────────────────
app.post('/api/webhooks/paymob', async (req, res) => {
    try {
        const payload = req.body;
        const hmacHeader = req.headers['hmac'];
        
        // التحقق من HMAC
        if (!paymob.verifyWebhook(payload, hmacHeader)) {
            console.error('❌ توقيع Paymob غير صالح');
            return res.status(400).send('Invalid signature');
        }
        
        const { obj: transactionData } = payload;
        const orderId = transactionData.order?.id;
        const success = transactionData.success;
        const amountCents = transactionData.amount_cents;
        
        // البحث عن المعاملة
        const transaction = await Transaction.findOne({ gatewayTransactionId: orderId });
        if (!transaction) {
            return res.status(404).send('Transaction not found');
        }
        
        if (success) {
            // تحديث المعاملة
            transaction.status = 'completed';
            transaction.completedAt = new Date();
            transaction.paymentDetails = {
                cardLastFour: transactionData.source_data?.pan?.slice(-4),
                walletProvider: transactionData.source_data?.sub_type
            };
            await transaction.save();
            
            // تحديث الرصيد
            const wallet = await Wallet.findById(transaction.walletId);
            wallet.balance += transaction.amount;
            wallet.totalDeposits += transaction.amount;
            wallet.lastTransactionAt = new Date();
            await wallet.save();
            
            console.log(`✅ دفع ناجح: ${transaction.transactionId} - ${amountCents / 100} EGP`);
        } else {
            transaction.status = 'failed';
            transaction.failedAt = new Date();
            await transaction.save();
            
            console.log(`❌ دفع فاشل: ${transaction.transactionId}`);
        }
        
        res.status(200).send('OK');
    } catch (error) {
        console.error('Paymob Webhook Error:', error);
        res.status(500).send('Error');
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// Routes - الدفع عبر Fawry
// ═══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────
// إنشاء رقم مرجعي للدفع عبر فوري
// ─────────────────────────────────────────────────────────────────────────
app.post('/api/payments/fawry/reference', authenticate, paymentLimiter, async (req, res) => {
    try {
        const { amount, description = 'دفع عبر فوري' } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'المبلغ غير صالح' });
        }
        
        const wallet = await Wallet.findOne({ userId: req.user._id });
        const merchantRefNum = `FAWRY-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        
        // إنشاء معاملة
        const transaction = new Transaction({
            transactionId: `TXN-FAWRY-${Date.now()}`,
            userId: req.user._id,
            walletId: wallet._id,
            type: 'deposit',
            amount: amount * 100,
            currency: 'EGP',
            fee: Math.round(amount * 100 * 0.015), // 1.5% رسوم فوري
            netAmount: Math.round(amount * 100 * 0.985),
            gateway: 'fawry',
            paymentMethod: 'reference',
            status: 'pending',
            description,
            gatewayReference: merchantRefNum
        });
        await transaction.save();
        
        // إنشاء الرقم المرجعي
        const customerData = {
            id: req.user._id.toString(),
            name: `${req.user.firstName} ${req.user.lastName}`,
            email: req.user.email,
            phone: req.user.phone
        };
        
        const result = await fawry.createReferencePayment(merchantRefNum, customerData, amount, description);
        
        if (!result.success) {
            transaction.status = 'failed';
            await transaction.save();
            return res.status(400).json({ error: result.error });
        }
        
        // تحديث المعاملة
        transaction.gatewayTransactionId = result.referenceNumber;
        transaction.paymentDetails = { referenceNumber: result.referenceNumber };
        await transaction.save();
        
        res.json({
            success: true,
            transactionId: transaction.transactionId,
            referenceNumber: result.referenceNumber,
            expiryDate: result.expiryDate,
            status: result.status,
            instructions: result.paymentInstructions,
            amount: amount,
            fee: amount * 0.015
        });
        
    } catch (error) {
        console.error('Fawry Reference Error:', error);
        res.status(500).json({ error: 'فشل إنشاء رقم الدفع' });
    }
});

// ─────────────────────────────────────────────────────────────────────────
// Webhook - Fawry (معالجة نتيجة الدفع)
// ─────────────────────────────────────────────────────────────────────────
app.post('/api/webhooks/fawry', async (req, res) => {
    try {
        const { merchantRefNum, paymentAmount, paymentStatus, fawryRefNumber } = req.body;
        
        // التحقق من التوقيع (Fawry يرسل signature في header)
        // TODO: Implement Fawry signature verification
        
        const transaction = await Transaction.findOne({ gatewayReference: merchantRefNum });
        if (!transaction) {
            return res.status(404).send('Transaction not found');
        }
        
        if (paymentStatus === 'PAID') {
            transaction.status = 'completed';
            transaction.completedAt = new Date();
            transaction.gatewayTransactionId = fawryRefNumber;
            await transaction.save();
            
            // تحديث الرصيد
            const wallet = await Wallet.findById(transaction.walletId);
            wallet.balance += transaction.netAmount;
            wallet.totalDeposits += transaction.netAmount;
            wallet.lastTransactionAt = new Date();
            await wallet.save();
            
            console.log(`✅ دفع فوري ناجح: ${transaction.transactionId}`);
        } else {
            transaction.status = 'failed';
            transaction.failedAt = new Date();
            await transaction.save();
        }
        
        res.status(200).send('OK');
    } catch (error) {
        console.error('Fawry Webhook Error:', error);
        res.status(500).send('Error');
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// Routes - السحب
// ═══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────
// طلب سحب إلى Vodafone Cash (عبر Paymob)
// ─────────────────────────────────────────────────────────────────────────
app.post('/api/withdrawals/vodafone', authenticate, requireKYC(1), paymentLimiter, async (req, res) => {
    try {
        const { amount, phoneNumber } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'المبلغ غير صالح' });
        }
        
        const wallet = await Wallet.findOne({ userId: req.user._id });
        
        // التحقق من الرصيد
        if (wallet.balance < amount * 100) {
            return res.status(400).json({ error: 'رصيد غير كافٍ' });
        }
        
        // التحقق من الحدود
        const todayWithdrawals = await Transaction.aggregate([
            { 
                $match: { 
                    userId: req.user._id, 
                    type: 'withdrawal',
                    status: 'completed',
                    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        const dailyTotal = (todayWithdrawals[0]?.total || 0) + amount * 100;
        if (dailyTotal > wallet.dailyLimit) {
            return res.status(400).json({ error: 'تم تجاوز الحد اليومي للسحب' });
        }
        
        // إنشاء معاملة سحب
        const transaction = new Transaction({
            transactionId: `TXN-WD-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            userId: req.user._id,
            walletId: wallet._id,
            type: 'withdrawal',
            amount: amount * 100,
            currency: 'EGP',
            fee: Math.round(amount * 100 * 0.01), // 1% رسوم
            netAmount: Math.round(amount * 100 * 0.99),
            gateway: 'vodafone_cash',
            paymentMethod: 'wallet',
            status: 'processing',
            description: 'سحب إلى Vodafone Cash',
            paymentDetails: { phoneNumber, walletProvider: 'vodafone' }
        });
        await transaction.save();
        
        // خصم الرصيد مؤقتاً
        wallet.balance -= transaction.amount;
        wallet.totalWithdrawals += transaction.amount;
        await wallet.save();
        
        // TODO: تنفيذ السحب الفعلي عبر Paymob API
        // هذا يتطلب API خاص بالسحب من Paymob
        
        res.json({
            success: true,
            transactionId: transaction.transactionId,
            status: 'processing',
            amount: amount,
            fee: amount * 0.01,
            netAmount: amount * 0.99,
            message: 'طلب السحب قيد المعالجة. سيصلك إشعار عند الاكتمال.'
        });
        
    } catch (error) {
        console.error('Withdrawal Error:', error);
        res.status(500).json({ error: 'فشل طلب السحب' });
    }
});

// ─────────────────────────────────────────────────────────────────────────
// طلب سحب عبر تحويل بنكي (InstaPay)
// ─────────────────────────────────────────────────────────────────────────
app.post('/api/withdrawals/instapay', authenticate, requireKYC(2), paymentLimiter, async (req, res) => {
    try {
        const { amount, receiverIPA, description = '' } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'المبلغ غير صالح' });
        }
        
        if (!receiverIPA) {
            return res.status(400).json({ error: 'عنوان IPA المستلم مطلوب' });
        }
        
        const wallet = await Wallet.findOne({ userId: req.user._id });
        
        if (wallet.balance < amount * 100) {
            return res.status(400).json({ error: 'رصيد غير كافٍ' });
        }
        
        // التحقق من صحة IPA
        const validation = await instapay.validateIPA(receiverIPA);
        if (!validation.valid) {
            return res.status(400).json({ error: 'عنوان IPA غير صالح' });
        }
        
        // إنشاء المعاملة
        const transaction = new Transaction({
            transactionId: `TXN-IP-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            userId: req.user._id,
            walletId: wallet._id,
            type: 'withdrawal',
            amount: amount * 100,
            currency: 'EGP',
            fee: 500, // 5 جنيه رسوم إنستاباي
            netAmount: amount * 100 - 500,
            gateway: 'instapay',
            paymentMethod: 'instapay',
            status: 'processing',
            description,
            paymentDetails: { 
                receiverIPA, 
                receiverName: validation.accountHolder,
                bankName: validation.bank
            }
        });
        await transaction.save();
        
        // خصم الرصيد
        wallet.balance -= transaction.amount;
        wallet.totalWithdrawals += transaction.amount;
        await wallet.save();
        
        // TODO: تنفيذ التحويل الفعلي عبر InstaPay API
        
        res.json({
            success: true,
            transactionId: transaction.transactionId,
            status: 'processing',
            amount: amount,
            fee: 5,
            netAmount: amount - 5,
            receiver: validation.accountHolder,
            bank: validation.bank,
            message: 'التحويل قيد المعالجة. يستغرق عادةً بضع ثوانٍ.'
        });
        
    } catch (error) {
        console.error('InstaPay Withdrawal Error:', error);
        res.status(500).json({ error: 'فشل التحويل' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// Routes - KYC (اعرف عميلك)
// ═══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────
// رفع مستندات KYC
// ─────────────────────────────────────────────────────────────────────────
app.post('/api/kyc/upload', authenticate, async (req, res) => {
    try {
        const { documentType, documentUrl } = req.body;
        
        const validTypes = ['national_id', 'selfie', 'address_proof', 'commercial_register'];
        if (!validTypes.includes(documentType)) {
            return res.status(400).json({ error: 'نوع المستند غير صالح' });
        }
        
        req.user.kycDocuments.push({
            type: documentType,
            url: documentUrl,
            verified: false
        });
        
        await req.user.save();
        
        res.json({
            success: true,
            message: 'تم رفع المستند بنجاح. قيد المراجعة.'
        });
        
    } catch (error) {
        res.status(500).json({ error: 'فشل رفع المستند' });
    }
});

// ─────────────────────────────────────────────────────────────────────────
// التحقق من مستوى KYC (للأدمن فقط)
// ─────────────────────────────────────────────────────────────────────────
app.post('/api/kyc/verify/:userId', authenticate, async (req, res) => {
    try {
        // TODO: التحقق من صلاحيات الأدمن
        const { userId } = req.params;
        const { level } = req.body;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'المستخدم غير موجود' });
        }
        
        user.kycLevel = level;
        user.kycVerified = level >= 1;
        await user.save();
        
        res.json({
            success: true,
            message: `تم ترقية KYC إلى المستوى ${level}`
        });
        
    } catch (error) {
        res.status(500).json({ error: 'فشل التحقق' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// Routes - عامة
// ═══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────
// صحة الخادم
// ─────────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// ─────────────────────────────────────────────────────────────────────────
// إحصائيات النظام (للأدمن)
// ─────────────────────────────────────────────────────────────────────────
app.get('/api/admin/stats', authenticate, async (req, res) => {
    try {
        // TODO: التحقق من صلاحيات الأدمن
        
        const stats = await Promise.all([
            User.countDocuments(),
            Wallet.countDocuments(),
            Transaction.countDocuments(),
            Transaction.countDocuments({ status: 'completed' }),
            Transaction.aggregate([
                { $match: { status: 'completed', type: 'deposit' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ])
        ]);
        
        res.json({
            users: stats[0],
            wallets: stats[1],
            transactions: stats[2],
            completedTransactions: stats[3],
            totalVolume: stats[4][0]?.total / 100 || 0
        });
        
    } catch (error) {
        res.status(500).json({ error: 'فشل جلب الإحصائيات' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// معالجة الأخطاء
// ═══════════════════════════════════════════════════════════════════════════
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ 
        error: 'خطأ في الخادم',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// تشغيل الخادم
// ═══════════════════════════════════════════════════════════════════════════
app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║   🌸  ياسمين (Yasmin Hub) - Payment Server                    ║
    ║                                                               ║
    ║   🚀 الخادم يعمل على: http://localhost:${PORT}                    ║
    ║                                                               ║
    ║   📦 البوابات المتاحة:                                         ║
    ║      • Paymob      (بطاقات + محافظ)                           ║
    ║      • Fawry       (نقاط تحصيل)                               ║
    ║      • InstaPay    (تحويلات بنكية)                            ║
    ║      • Vodafone Cash (عبر Paymob)                             ║
    ║                                                               ║
    ║   ⚠️  وضع: ${process.env.NODE_ENV || 'development'}                                    ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
    `);
})
