/**
 * EMAIL SERVICE FOR ORDER NOTIFICATIONS
 * Handles email sending for order creation, status updates, and delivery notifications
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

// Configure email transporter (Gmail or SendGrid)
let transporter;

// Initialize email service
function initializeEmailService() {
    try {
        // Using Gmail SMTP (requires App Password, not regular Gmail password)
        // You can also use SendGrid or any other SMTP provider
        const emailUser = process.env.EMAIL_USER;
        const emailPassword = process.env.EMAIL_PASSWORD;

        if (!emailUser || !emailPassword) {
            console.warn('⚠️ Email credentials not configured. Email notifications disabled.');
            console.warn('   Set EMAIL_USER and EMAIL_PASSWORD in .env to enable email notifications');
            return false;
        }

        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: emailUser,
                pass: emailPassword // Use App Password for Gmail (not your regular password)
            }
        });

        console.log('✅ Email service initialized');
        return true;
    } catch (error) {
        console.error('❌ Email service initialization failed:', error.message);
        return false;
    }
}

// Email templates
const emailTemplates = {
    orderCreated: (orderData) => ({
        subject: `📦 Đơn hàng của bạn đã được tạo - #${orderData.orderId}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 8px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px;">✅ Đơn hàng được tạo</h1>
                </div>
                
                <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
                    <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                        Cảm ơn bạn! Đơn hàng của bạn đã được tạo thành công trên hệ thống theo dõi blockchain.
                    </p>
                    
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
                        <h3 style="color: #667eea; margin-top: 0;">Thông tin đơn hàng</h3>
                        <p style="margin: 8px 0;"><strong>Mã đơn hàng:</strong> ${orderData.orderId}</p>
                        <p style="margin: 8px 0;"><strong>Sản phẩm:</strong> ${orderData.productName || 'Không xác định'}</p>
                        <p style="margin: 8px 0;"><strong>Số lượng:</strong> ${orderData.quantity || 'N/A'}</p>
                        <p style="margin: 8px 0;"><strong>Giá:</strong> ${orderData.price ? orderData.price + ' VND' : 'N/A'}</p>
                        <p style="margin: 8px 0;"><strong>Thời gian tạo:</strong> ${new Date(orderData.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                    
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
                        <h3 style="color: #667eea; margin-top: 0;">Thông tin người nhận</h3>
                        <p style="margin: 8px 0;"><strong>Tên:</strong> ${orderData.recipientName || 'Không xác định'}</p>
                        <p style="margin: 8px 0;"><strong>Điện thoại:</strong> ${orderData.recipientPhone || 'Không xác định'}</p>
                        <p style="margin: 8px 0;"><strong>Địa chỉ:</strong> ${orderData.recipientAddress || 'Không xác định'}</p>
                    </div>
                    
                    <div style="background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 20px 0;">
                        <p style="margin: 0; color: #92400e;">
                            <strong>ℹ️ Hash trên blockchain:</strong> ${orderData.metadataHash || 'Đang xử lý...'}
                        </p>
                    </div>
                    
                    <p style="color: #666; font-size: 14px; margin-top: 20px; text-align: center;">
                        Bạn có thể theo dõi trạng thái đơn hàng của mình bất kỳ lúc nào trên hệ thống.
                    </p>
                </div>
            </div>
        `
    }),

    orderStatusUpdated: (orderData) => {
        const statusMap = {
            '0': { label: '📋 Chờ xác nhận', color: '#6366f1' },
            '1': { label: '✅ Đã xác nhận', color: '#3b82f6' },
            '2': { label: '🚚 Đang giao hàng', color: '#f59e0b' },
            '3': { label: '✔️ Đã giao', color: '#10b981' },
            '4': { label: '❌ Hủy', color: '#ef4444' }
        };

        const statusInfo = statusMap[orderData.status] || { label: 'Không xác định', color: '#6b7280' };

        return {
            subject: `${statusInfo.label.split(' ')[0]} Trạng thái đơn hàng #${orderData.orderId} đã thay đổi`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 8px;">
                    <div style="background: linear-gradient(135deg, ${statusInfo.color} 0%, ${statusInfo.color}dd 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px;">${statusInfo.label}</h1>
                    </div>
                    
                    <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
                        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                            Trạng thái đơn hàng của bạn đã được cập nhật!
                        </p>
                        
                        <div style="background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
                            <h3 style="color: ${statusInfo.color}; margin-top: 0;">Chi tiết cập nhật</h3>
                            <p style="margin: 8px 0;"><strong>Mã đơn hàng:</strong> ${orderData.orderId}</p>
                            <p style="margin: 8px 0;"><strong>Trạng thái:</strong> ${statusInfo.label}</p>
                            <p style="margin: 8px 0;"><strong>Thời gian cập nhật:</strong> ${new Date(orderData.updatedAt).toLocaleString('vi-VN')}</p>
                            ${orderData.notes ? `<p style="margin: 8px 0;"><strong>Ghi chú:</strong> ${orderData.notes}</p>` : ''}
                        </div>
                        
                        <div style="background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
                            <h3 style="color: ${statusInfo.color}; margin-top: 0;">Thông tin sản phẩm</h3>
                            <p style="margin: 8px 0;"><strong>Sản phẩm:</strong> ${orderData.productName || 'Không xác định'}</p>
                            <p style="margin: 8px 0;"><strong>Số lượng:</strong> ${orderData.quantity || 'N/A'}</p>
                            <p style="margin: 8px 0;"><strong>Giá:</strong> ${orderData.price ? orderData.price + ' VND' : 'N/A'}</p>
                        </div>
                        
                        <p style="color: #666; font-size: 14px; margin-top: 20px; text-align: center;">
                            Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!
                        </p>
                    </div>
                </div>
            `
        };
    },

    orderDelivered: (orderData) => ({
        subject: `🎉 Đơn hàng #${orderData.orderId} đã được giao thành công!`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 8px;">
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px;">🎉 Giao hàng thành công!</h1>
                </div>
                
                <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
                    <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                        Đơn hàng của bạn đã được giao thành công! Cảm ơn bạn đã tin tưởng chúng tôi.
                    </p>
                    
                    <div style="background: #ecfdf5; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981;">
                        <h3 style="color: #047857; margin-top: 0;">✅ Đơn hàng được xác nhận</h3>
                        <p style="margin: 8px 0;"><strong>Mã đơn hàng:</strong> ${orderData.orderId}</p>
                        <p style="margin: 8px 0;"><strong>Sản phẩm:</strong> ${orderData.productName || 'Không xác định'}</p>
                        <p style="margin: 8px 0;"><strong>Người nhận:</strong> ${orderData.recipientName || 'Không xác định'}</p>
                        <p style="margin: 8px 0;"><strong>Ngày giao:</strong> ${new Date(orderData.deliveredAt).toLocaleString('vi-VN')}</p>
                    </div>
                    
                    <p style="color: #666; font-size: 14px; margin-top: 20px; text-align: center;">
                        Nếu bạn có bất kỳ câu hỏi hoặc vấn đề nào, vui lòng liên hệ với chúng tôi.
                    </p>
                </div>
            </div>
        `
    })
};

// Send email function
async function sendEmail(to, templateType, data) {
    if (!transporter) {
        console.warn('⚠️ Email service not initialized. Email not sent.');
        return false;
    }

    try {
        const template = emailTemplates[templateType];
        if (!template) {
            console.error(`❌ Email template not found: ${templateType}`);
            return false;
        }

        const emailContent = template(data);

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: to,
            subject: emailContent.subject,
            html: emailContent.html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${to} - Message ID: ${info.messageId}`);
        return true;

    } catch (error) {
        console.error(`❌ Failed to send email to ${to}:`, error.message);
        return false;
    }
}

// Send order created notification
async function notifyOrderCreated(recipientEmail, orderData) {
    return await sendEmail(recipientEmail, 'orderCreated', orderData);
}

// Send order status updated notification
async function notifyOrderStatusUpdated(recipientEmail, orderData) {
    return await sendEmail(recipientEmail, 'orderStatusUpdated', orderData);
}

// Send order delivered notification
async function notifyOrderDelivered(recipientEmail, orderData) {
    return await sendEmail(recipientEmail, 'orderDelivered', orderData);
}

module.exports = {
    initializeEmailService,
    sendEmail,
    notifyOrderCreated,
    notifyOrderStatusUpdated,
    notifyOrderDelivered
};
