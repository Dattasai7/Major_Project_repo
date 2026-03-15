import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { updateProfile } from '../api';
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
import { ArrowLeft, Save, User as UserIcon, LogOut, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export const Profile = () => {
  const navigate = useNavigate();
  const { user, setUser, theme, logout } = useApp();
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(user || {
    name: '',
    ageRange: '',
    country: '',
    city: '',
    language: '',
    gender: '',
    height: '',
    weight: '',
    conditions: '',
    personalization: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const updated = await updateProfile(formData);
      setUser(updated as any);
      setEditMode(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'} p-6`}>
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/home')}
          className={`mb-6 ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <ArrowLeft className="size-4 mr-2" />
          Back to Home
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl p-8 ${
            theme === 'dark'
              ? 'bg-slate-900/50 backdrop-blur-xl border border-slate-800/50'
              : 'bg-white border border-slate-200'
          } shadow-2xl`}
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                <UserIcon className="size-8 text-white" />
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  My Profile
                </h1>
                <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
                  Manage your personal information and preferences
                </p>
              </div>
            </div>

            {!editMode && (
              <Button
                onClick={() => setEditMode(true)}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
              >
                Edit Profile
              </Button>
            )}
          </div>

          {error && (
            <div className="text-red-500 text-sm font-medium bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
              {error}
            </div>
          )}

          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className={theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}>
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="personalization">Personalization</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Name or Nickname</Label>
                  {editMode ? (
                    <Input
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      className={theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-300'}
                    />
                  ) : (
                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
                      <p className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>{formData.name}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Age Range</Label>
                  {editMode ? (
                    <Select
                      value={formData.ageRange}
                      onValueChange={(val) => updateField('ageRange', val)}
                    >
                      <SelectTrigger className={theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-300'}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}>
                        <SelectItem value="18-25">18-25</SelectItem>
                        <SelectItem value="26-35">26-35</SelectItem>
                        <SelectItem value="36-45">36-45</SelectItem>
                        <SelectItem value="46-55">46-55</SelectItem>
                        <SelectItem value="56-65">56-65</SelectItem>
                        <SelectItem value="65+">65+</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
                      <p className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>{formData.ageRange}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Country</Label>
                  {editMode ? (
                    <Input
                      value={formData.country}
                      onChange={(e) => updateField('country', e.target.value)}
                      className={theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-300'}
                    />
                  ) : (
                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
                      <p className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>{formData.country}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>City</Label>
                  {editMode ? (
                    <Input
                      value={formData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      className={theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-300'}
                    />
                  ) : (
                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
                      <p className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>{formData.city}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Preferred Language</Label>
                  {editMode ? (
                    <Select
                      value={formData.language}
                      onValueChange={(val) => updateField('language', val)}
                    >
                      <SelectTrigger className={theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-300'}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="spanish">Spanish</SelectItem>
                        <SelectItem value="french">French</SelectItem>
                        <SelectItem value="german">German</SelectItem>
                        <SelectItem value="chinese">Chinese</SelectItem>
                        <SelectItem value="japanese">Japanese</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
                      <p className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>{formData.language}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Gender</Label>
                  {editMode ? (
                    <Select
                      value={formData.gender}
                      onValueChange={(val) => updateField('gender', val)}
                    >
                      <SelectTrigger className={theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-300'}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="non-binary">Non-binary</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
                      <p className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>{formData.gender}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Height (cm)</Label>
                  {editMode ? (
                    <Input
                      type="number"
                      value={formData.height}
                      onChange={(e) => updateField('height', e.target.value)}
                      className={theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-300'}
                    />
                  ) : (
                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
                      <p className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>{formData.height} cm</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  {editMode ? (
                    <Input
                      type="number"
                      value={formData.weight}
                      onChange={(e) => updateField('weight', e.target.value)}
                      className={theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-300'}
                    />
                  ) : (
                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
                      <p className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>{formData.weight} kg</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Existing Conditions</Label>
                {editMode ? (
                  <Textarea
                    value={formData.conditions}
                    onChange={(e) => updateField('conditions', e.target.value)}
                    className={`min-h-24 ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-300'}`}
                  />
                ) : (
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
                    <p className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>
                      {formData.conditions || 'No conditions specified'}
                    </p>
                  </div>
                )}
              </div>

              {editMode && (
                <div className="flex gap-3">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
                  >
                    {saving ? (
                      <Loader2 className="size-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="size-4 mr-2" />
                    )}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    onClick={() => {
                      setEditMode(false);
                      setFormData(user);
                    }}
                    variant="outline"
                    className={theme === 'dark' ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="personalization" className="space-y-4">
              <div className="space-y-2">
                <Label>Personalization Preferences</Label>
                <Textarea
                  value={formData.personalization || ''}
                  onChange={(e) => updateField('personalization', e.target.value)}
                  className={`min-h-32 ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-300'}`}
                  placeholder="Tell us about your preferences, goals, dietary restrictions, or any other information that would help us personalize your experience..."
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
              >
                {saving ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : (
                  <Save className="size-4 mr-2" />
                )}
                {saving ? 'Saving...' : 'Save Personalization'}
              </Button>
            </TabsContent>
          </Tabs>

          <div className={`mt-8 pt-8 border-t ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'} flex justify-end`}>
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <LogOut className="size-4 mr-2" />
              Logout
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
