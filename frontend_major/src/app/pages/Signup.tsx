import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { motion } from 'motion/react';
import { Sparkles, ArrowLeft, ChevronRight } from 'lucide-react';

export const Signup = () => {
  const navigate = useNavigate();
  const { setUser } = useApp();

  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    retypePassword: '',
    ageRange: '',
    country: '',
    city: '',
    language: '',
    gender: '',
    height: '',
    weight: '',
    conditions: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.retypePassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    const { retypePassword, ...userData } = formData;
    setUser(userData);
    navigate('/home');
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center p-6">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute top-1/4 -left-1/4 size-96 rounded-full bg-violet-600/10 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute bottom-1/4 -right-1/4 size-96 rounded-full bg-indigo-600/10 blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="size-4 mr-2" />
          Back to Home
        </Button>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="size-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Sparkles className="size-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Create Your Profile</h1>
              <p className="text-slate-400">Tell us about yourself to get started</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="text-red-500 text-sm font-medium">{error}</div>}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="bg-slate-800/50 border-slate-700 focus:border-violet-500"
                  placeholder="Enter your email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  className="bg-slate-800/50 border-slate-700 focus:border-violet-500"
                  placeholder="Enter your password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="retypePassword">Retype Password *</Label>
                <Input
                  id="retypePassword"
                  type="password"
                  required
                  value={formData.retypePassword}
                  onChange={(e) => updateField('retypePassword', e.target.value)}
                  className="bg-slate-800/50 border-slate-700 focus:border-violet-500"
                  placeholder="Retype your password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name or Nickname *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="bg-slate-800/50 border-slate-700 focus:border-violet-500"
                  placeholder="Enter your name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ageRange">Age Range *</Label>
                <Select value={formData.ageRange} onValueChange={(val) => updateField('ageRange', val)} required>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 focus:border-violet-500">
                    <SelectValue placeholder="Select age range" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="18-25">18-25</SelectItem>
                    <SelectItem value="26-35">26-35</SelectItem>
                    <SelectItem value="36-45">36-45</SelectItem>
                    <SelectItem value="46-55">46-55</SelectItem>
                    <SelectItem value="56-65">56-65</SelectItem>
                    <SelectItem value="65+">65+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  required
                  value={formData.country}
                  onChange={(e) => updateField('country', e.target.value)}
                  className="bg-slate-800/50 border-slate-700 focus:border-violet-500"
                  placeholder="Your country"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  required
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className="bg-slate-800/50 border-slate-700 focus:border-violet-500"
                  placeholder="Your city"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Preferred Language *</Label>
                <Select value={formData.language} onValueChange={(val) => updateField('language', val)} required>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 focus:border-violet-500">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="spanish">Spanish</SelectItem>
                    <SelectItem value="french">French</SelectItem>
                    <SelectItem value="german">German</SelectItem>
                    <SelectItem value="chinese">Chinese</SelectItem>
                    <SelectItem value="japanese">Japanese</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select value={formData.gender} onValueChange={(val) => updateField('gender', val)} required>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 focus:border-violet-500">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="non-binary">Non-binary</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="height">Height (cm) *</Label>
                <Input
                  id="height"
                  required
                  type="number"
                  value={formData.height}
                  onChange={(e) => updateField('height', e.target.value)}
                  className="bg-slate-800/50 border-slate-700 focus:border-violet-500"
                  placeholder="170"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg) *</Label>
                <Input
                  id="weight"
                  required
                  type="number"
                  value={formData.weight}
                  onChange={(e) => updateField('weight', e.target.value)}
                  className="bg-slate-800/50 border-slate-700 focus:border-violet-500"
                  placeholder="70"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="conditions">Existing Conditions</Label>
              <Textarea
                id="conditions"
                value={formData.conditions}
                onChange={(e) => updateField('conditions', e.target.value)}
                className="bg-slate-800/50 border-slate-700 focus:border-violet-500 min-h-24"
                placeholder="Please list any existing medical conditions or health concerns..."
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/30 group"
            >
              Save and Proceed
              <ChevronRight className="size-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
