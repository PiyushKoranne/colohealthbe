
module.exports.apiLoginKey = '5KP3u95bQpv';
module.exports.transactionKey = '346HZ32z3fP4hTG2';

module.exports.registrationSUB = `Greetings! Welcome to ColoHealth Provider Portal.`;
module.exports.registrationHTML  = (match) => (
	`
<h2 style="background-color:#140342;color:white;padding:10px;"><span><img alt="logo" title="logo-title" style="display:block;" height="60" width="120" src="${process.env.REACT_APP_BACKEND_URL}/logo/Email_Sign_Logo.png"></span>ColoHealth</h2>
						
						<p><strong>Dear ${match?.firstName+" "+match?.lastName || 'User'},</strong></p>      
						
						<p>We hope you are doing well.</p>
						
						<p>Welcome to <strong style="color:#0284c7;padding:5px; font-size:16px;">ColoHealth</strong> we are thrilled to have you on board!</p>
						
						<p>Your account has been created on the <strong style="color:#0284c7;text-decoration:underline;">ColoHealth Provider Portal</strong></p>
						
						<p>Colohealth is an online platform that has been serving in the field for the past 9 years.</p>
						
						<p>Please make sure to NOT share your credentials with anyone as your profile may contain sensitive data of your patients</p>
						
						<p>Links for the social media accounts of ColoHealth Account.</p>
						
						<p><strong>Our social media accounts:</strong></p>
						
						<p>Linkedin</p>
						<p><a href="https://www.linkedin.com/company/conative-it-solutions-pvt-ltd/mycompany/company" target="_blank">https://www.linkedin.com/company/conative-it-solutions-pvt-ltd/mycompany/company</p>
						
						<p>Instagram:</p>
						www.instagram.com/conative_it_solutions/</p>
						
						<p>Facebook:</p>
						<p><a href="https://www.facebook.com/conativeitsolutions" target="_blank">https://www.facebook.com/conativeitsolutions</p>
						
						<p>Twitter:</p>
						<p><a href="https://twitter.com/CITSINDORE" target="_blank">https://twitter.com/CITSINDORE</p>
						
						<p>Pinterest:</p>
						<p><a href="https://in.pinterest.com/conativeitsolutions/" target="_blank">https://in.pinterest.com/conativeitsolutions/</p>
						
						<p>Skype ID:</p>
						<p><a href="skype:conativeitsolutions" target="_blank">conativeitsolutions</a></p>

						<p><strong>Warm regards,</strong></p>
						<p><strong>ColoHealth Team.</strong></p>
`
)
