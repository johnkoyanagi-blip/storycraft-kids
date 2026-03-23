'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useProfile, type Profile } from '@/hooks/use-profile';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Input } from '@/components/ui/input';

export default function ProfilesPage() {
  const { status } = useSession();
  const router = useRouter();
  const { setProfile } = useProfile();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileAge, setNewProfileAge] = useState('6');
  const [addingProfile, setAddingProfile] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchProfiles();
    }
  }, [status, router]);

  async function fetchProfiles() {
    try {
      const res = await fetch('/api/profiles');
      if (res.ok) {
        const data = await res.json();
        setProfiles(data);
      }
    } catch (err) {
      console.error('Failed to fetch profiles:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    setAddingProfile(true);
    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: newProfileName,
          age: parseInt(newProfileAge),
        }),
      });

      if (res.ok) {
        setNewProfileName('');
        setNewProfileAge('6');
        setShowAddModal(false);
        await fetchProfiles();
      }
    } catch (err) {
      console.error('Failed to add profile:', err);
    } finally {
      setAddingProfile(false);
    }
  }

  function handleSelectProfile(profile: Profile) {
    setProfile(profile);
    router.push('/library');
  }

  if (status === 'loading' || loading) {
    return <LoadingSpinner message="Loading your profiles..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-50 to-orange-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-black text-purple-700 mb-2 text-center">StoryCraft Kids</h1>
        <p className="text-purple-600 text-center mb-12 text-xl font-semibold">Which child would like to create a story?</p>

        {profiles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-6">No child profiles yet. Let's create one!</p>
            <Button variant="primary" size="lg" onClick={() => setShowAddModal(true)}>
              Add Your First Child
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {profiles.map((profile) => (
                <Card
                  key={profile.id}
                  onClick={() => handleSelectProfile(profile)}
                  className="bg-white hover:bg-purple-50 transition-all"
                >
                  <div className="text-center">
                    {profile.avatarUrl && (
                      <img src={profile.avatarUrl} alt={profile.displayName} className="w-20 h-20 rounded-full mx-auto mb-4" />
                    )}
                    <h2 className="text-2xl font-bold text-purple-700 mb-2">{profile.displayName}</h2>
                    <p className="text-purple-600 font-semibold mb-4">Age {profile.age}</p>
                    <p className="text-gray-600">{profile.storyCount} stories created</p>
                  </div>
                </Card>
              ))}
            </div>

            {profiles.length < 5 && (
              <div className="text-center">
                <Button variant="secondary" size="lg" onClick={() => setShowAddModal(true)}>
                  Add Another Child
                </Button>
              </div>
            )}
          </>
        )}

        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <h2 className="text-2xl font-bold text-purple-700 mb-6 text-center">Add a Child Profile</h2>
              <form onSubmit={handleAddProfile} className="space-y-4">
                <Input
                  label="Child's Name"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="Enter name"
                  required
                />
                <div>
                  <label className="block text-sm font-semibold text-purple-900 mb-1">Age</label>
                  <select
                    value={newProfileAge}
                    onChange={(e) => setNewProfileAge(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none text-base text-gray-900"
                  >
                    {Array.from({ length: 7 }, (_, i) => 6 + i).map((age) => (
                      <option key={age} value={age}>
                        {age} years old
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={() => setShowAddModal(false)}
                    type="button"
                    disabled={addingProfile}
                  >
                    Cancel
                  </Button>
                  <Button variant="primary" className="flex-1" type="submit" loading={addingProfile}>
                    Create
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
