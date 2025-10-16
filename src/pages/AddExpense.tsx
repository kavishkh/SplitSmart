import { useState } from "react";
import { ArrowLeft, Receipt, Users, IndianRupee } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { useGroups } from "@/hooks/use-groups";
import { useExpenses } from "@/hooks/use-expenses";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";

const AddExpense = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { groups } = useGroups();
  const { addExpense } = useExpenses();
  const { currentUser } = useUser();
  
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState(groupId || "");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([currentUser?.id || "current-user"]);
  
  // Get members from selected group
  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const availableMembers = selectedGroup ? selectedGroup.members : [];

  const categories = [
    { id: "food", name: "Food & Dining", icon: "🍽️" },
    { id: "transport", name: "Transportation", icon: "🚗" },
    { id: "entertainment", name: "Entertainment", icon: "🎬" },
    { id: "utilities", name: "Utilities", icon: "💡" },
    { id: "shopping", name: "Shopping", icon: "🛍️" },
    { id: "other", name: "Other", icon: "📄" }
  ];

  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const calculateSplit = () => {
    const total = parseFloat(amount) || 0;
    const count = selectedMembers.length;
    return count > 0 ? (total / count).toFixed(2) : "0.00";
  };
  
  const handleSubmit = () => {
    if (!amount || !description || !selectedGroupId || !category) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (selectedMembers.length === 0) {
      toast.error("Please select at least one member to split with");
      return;
    }

    addExpense({
      description,
      amount: parseFloat(amount),
      category,
      groupId: selectedGroupId,
      paidBy: currentUser?.id || "current-user",
      splitBetween: selectedMembers,
      createdBy: currentUser?.id || "current-user"
    });

    // Navigate back to group or dashboard
    if (groupId) {
      navigate(`/groups/${groupId}`);
    } else {
      navigate("/");
    }
  };

  const getBackLink = () => {
    if (groupId) {
      return `/groups/${groupId}`;
    }
    return "/";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Back Navigation */}
        <div className="mb-6 animate-slide-up">
          <Link to={getBackLink()}>
            <Button variant="ghost" className="mb-4 px-4 py-2 h-9 hover:bg-gray-800 hover:text-white hover:-translate-y-0.5 hover:scale-105 transition-all duration-300 rounded-lg">
              <ArrowLeft className="h-3 w-3 mr-1" />
              {groupId ? "Back to Group" : "Back to Dashboard"}
            </Button>
          </Link>
        </div>

        {/* Page Header */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
            <Receipt className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-black mb-2">Add New Expense</h1>
          <p className="text-gray-600">Split an expense with your group members</p>
        </div>

        <Card className="card-balance animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <CardContent className="p-8 space-y-8">
            {/* Amount */}
            <div className="space-y-3">
              <Label htmlFor="amount" className="text-lg font-semibold text-black">Amount *</Label>
              <div className="relative">
                <IndianRupee className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-600" />
                <input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 text-2xl font-bold h-14 text-center rounded-md border-2 border-gray-400 focus:border-blue-500 focus:outline-none"
                  style={{ 
                    color: '#000000',
                    backgroundColor: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: '24px'
                  }}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <Label htmlFor="description" className="text-lg font-semibold text-black">Description *</Label>
              <Textarea
                id="description"
                placeholder="What was this expense for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] text-lg text-black bg-white border border-gray-300 focus:border-blue-500 placeholder:text-gray-400"
                style={{ color: 'black' }}
              />
            </div>

            {/* Category */}
            <div className="space-y-3">
              <Label className="text-lg font-semibold text-black">Category *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <Card 
                    key={cat.id}
                    className={`cursor-pointer transition-all duration-200 ${
                      category === cat.id 
                        ? "ring-2 ring-primary bg-primary/10 card-interactive" 
                        : "hover:bg-muted/50 card-interactive"
                    }`}
                    onClick={() => setCategory(cat.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl mb-2">{cat.icon}</div>
                      <div className="text-sm font-medium text-black">{cat.name}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Group Selection */}
            <div className="space-y-3">
              <Label htmlFor="group" className="text-lg font-semibold text-black">Group *</Label>
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger className="h-12 text-lg text-black bg-white border border-gray-300 focus:border-blue-500" style={{ color: 'black' }}>
                  <SelectValue placeholder="Select a group" className="text-black" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id} className="py-3 text-black hover:bg-gray-100" style={{ color: 'black' }}>
                      <div className="flex items-center space-x-3">
                        <Users className="h-5 w-5 text-black" />
                        <span className="text-lg text-black" style={{ color: 'black' }}>{g.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Split Between */}
            {selectedGroupId && availableMembers.length > 0 && (
              <div className="space-y-4">
                <Label className="text-lg font-semibold text-black">Split Between</Label>
                <div className="space-y-3">
                  {availableMembers.map((member) => (
                    <Card 
                      key={member.id}
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedMembers.includes(member.id)
                          ? "ring-2 ring-primary bg-primary/10"
                          : "hover:bg-muted/20"
                      } card-interactive`}
                      onClick={() => toggleMember(member.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          <Checkbox 
                            checked={selectedMembers.includes(member.id)}
                            onChange={() => toggleMember(member.id)}
                          />
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="bg-gradient-accent text-accent-foreground">
                              {member.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <span className="font-semibold text-lg text-black">{member.name}</span>
                          </div>
                          {selectedMembers.includes(member.id) && (
                            <Badge variant="secondary" className="text-lg px-3 py-1">
                              ${calculateSplit()}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {selectedMembers.length > 0 && amount && (
              <Card className="bg-gradient-primary/10 border-primary/30 animate-slide-up">
                <CardContent className="p-6">
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold text-black">Expense Summary</h3>
                    <div className="flex items-center justify-center space-x-8">
                      <div>
                        <p className="text-sm text-gray-600">Total Amount</p>
                        <p className="text-2xl font-bold text-primary">₹{amount}</p>
                      </div>
                      <div className="w-px h-12 bg-border"></div>
                      <div>
                        <p className="text-sm text-gray-600">Split {selectedMembers.length} ways</p>
                        <p className="text-2xl font-bold text-black">₹{calculateSplit()} each</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex space-x-4 mt-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <Link to={getBackLink()} className="flex-1">
            <Button variant="outline" className="w-full px-4 py-2 h-9 hover:bg-gray-800 hover:text-white hover:-translate-y-0.5 hover:scale-105 transition-all duration-300 rounded-lg">
              Cancel
            </Button>
          </Link>
          <Button className="bg-blue-500 hover:bg-blue-800 text-black hover:text-white shadow-md hover:shadow-lg px-4 py-2 h-9 hover:-translate-y-0.5 hover:scale-105 transition-all duration-300 rounded-lg flex-1" onClick={handleSubmit}>
            <Receipt className="h-3 w-3 mr-1" />
            Add Expense
          </Button>
        </div>
      </main>

      {/* Floating Elements */}
      <div className="fixed top-20 right-10 w-32 h-32 bg-gradient-primary/10 rounded-full blur-3xl animate-float -z-10" />
      <div className="fixed bottom-20 left-10 w-24 h-24 bg-gradient-accent/10 rounded-full blur-2xl animate-float -z-10" style={{ animationDelay: "1s" }} />
    </div>
  );
};

export default AddExpense;