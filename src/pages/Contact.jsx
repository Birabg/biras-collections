import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, Loader2 } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    else if (formData.message.trim().length < 10) newErrors.message = 'Message must be at least 10 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);

    toast.success('Message sent!', { message: 'We\'ll get back to you within 24 hours' });
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const contactInfo = [
    { icon: Mail, label: 'Email', value: 'support@birascollections.com', href: 'mailto:support@birascollections.com' },
    { icon: Phone, label: 'Phone', value: '+251 911 234 567', href: 'tel:+251911234567' },
    { icon: MapPin, label: 'Address', value: 'Bole Sub-city, Addis Ababa, Ethiopia', href: '#' },
    { icon: Clock, label: 'Hours', value: 'Mon-Sat: 9:00 AM - 7:00 PM', href: null },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
          <h1 className="text-4xl font-medium tracking-tight">Contact Us</h1>
          <p className="mt-2 text-gray-500">We'd love to hear from you. Get in touch with our team.</p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-3">
          {/* Contact Info */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
              {contactInfo.map((item) => (
                <a key={item.label} href={item.href} className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <item.icon size={20} strokeWidth={1.7} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">{item.label}</p>
                    <p className="text-gray-900">{item.value}</p>
                  </div>
                </a>
              ))}

              <div className="pt-4 border-t border-gray-100">
                <h3 className="font-medium mb-3">Frequently Asked Questions</h3>
                <div className="space-y-2">
                  <a href="/shipping" className="block text-sm text-gray-600 hover:text-black">Shipping information</a>
                  <a href="/returns" className="block text-sm text-gray-600 hover:text-black">Returns & exchanges</a>
                  <a href="/faq" className="block text-sm text-gray-600 hover:text-black">FAQ</a>
                  <a href="/contact" className="block text-sm text-gray-600 hover:text-black">Contact support</a>
                </div>
              </div>
            </div>
          </aside>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-100 p-6 lg:p-8">
              <h2 className="text-2xl font-medium mb-6">Send us a message</h2>

              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <div className="grid gap-6 md:grid-cols-2">
                  <Input label="Full name" name="name" type="text" value={formData.name} onChange={handleChange} error={errors.name} autoComplete="name" placeholder="Your name" />
                  <Input label="Email address" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} autoComplete="email" placeholder="you@example.com" />
                </div>
                <Input label="Subject" name="subject" type="text" value={formData.subject} onChange={handleChange} error={errors.subject} placeholder="What's this about?" list="subjects" />
                <datalist id="subjects">
                  <option value="Order inquiry" />
                  <option value="Shipping question" />
                  <option value="Return/Exchange" />
                  <option value="Product question" />
                  <option value="Website feedback" />
                  <option value="Other" />
                </datalist>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-900 mb-1.5">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${errors.message ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 hover:border-gray-300'} disabled:bg-gray-50`}
                    placeholder="Tell us how we can help..."
                    aria-invalid={errors.message ? 'true' : 'false'}
                    aria-describedby={errors.message ? 'message-error' : 'message-hint'}
                  />
                  {errors.message && <p id="message-error" className="mt-1.5 text-sm text-red-600" role="alert">{errors.message}</p>}
                  {!errors.message && <p id="message-hint" className="mt-1.5 text-sm text-gray-500">Please provide as much detail as possible.</p>}
                </div>

                <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <Send size={16} strokeWidth={2} className="ml-1" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}