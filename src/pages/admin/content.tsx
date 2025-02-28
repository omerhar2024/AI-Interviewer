import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Search,
  Plus,
  Edit,
  Trash,
  Filter,
  ArrowUpDown,
} from "lucide-react";

export default function AdminContentPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [formData, setFormData] = useState({
    text: "",
    type: "behavioral",
    sampleResponse: "",
  });
  const [filters, setFilters] = useState({
    type: "all",
    sortBy: "created_at",
    sortOrder: "desc" as "asc" | "desc",
  });

  useEffect(() => {
    fetchQuestions();
  }, [filters]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      let query = supabase.from("questions").select("*");

      // Apply type filter
      if (filters.type !== "all") {
        query = query.eq("type", filters.type);
      }

      // Apply sorting
      query = query.order(filters.sortBy, {
        ascending: filters.sortOrder === "asc",
      });

      const { data, error } = await query;

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load questions. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async () => {
    try {
      if (!formData.text.trim()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Question text is required.",
        });
        return;
      }

      const { data, error } = await supabase
        .from("questions")
        .insert([
          {
            text: formData.text,
            type: formData.type,
            sample_response: formData.sampleResponse,
          },
        ])
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question added successfully.",
      });

      setIsAddDialogOpen(false);
      resetForm();
      fetchQuestions();
    } catch (error) {
      console.error("Error adding question:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add question. Please try again.",
      });
    }
  };

  const handleEditQuestion = async () => {
    try {
      if (!formData.text.trim()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Question text is required.",
        });
        return;
      }

      const { data, error } = await supabase
        .from("questions")
        .update({
          text: formData.text,
          type: formData.type,
          sample_response: formData.sampleResponse,
        })
        .eq("id", currentQuestion.id)
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question updated successfully.",
      });

      setIsEditDialogOpen(false);
      resetForm();
      fetchQuestions();
    } catch (error) {
      console.error("Error updating question:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update question. Please try again.",
      });
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      // First check if the question exists
      const { data: checkData, error: checkError } = await supabase
        .from("questions")
        .select("id")
        .eq("id", id)
        .single();

      if (checkError) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Question not found.",
        });
        return;
      }

      const { error } = await supabase.from("questions").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question deleted successfully.",
      });

      fetchQuestions();
    } catch (error) {
      console.error("Error deleting question:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete question. Please try again.",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      text: "",
      type: "behavioral",
      sampleResponse: "",
    });
    setCurrentQuestion(null);
  };

  const openEditDialog = (question: any) => {
    setCurrentQuestion(question);
    setFormData({
      text: question.text,
      type: question.type,
      sampleResponse: question.sample_response || "",
    });
    setIsEditDialogOpen(true);
  };

  const toggleSortOrder = (field: string) => {
    if (filters.sortBy === field) {
      setFilters({
        ...filters,
        sortOrder: filters.sortOrder === "asc" ? "desc" : "asc",
      });
    } else {
      setFilters({
        ...filters,
        sortBy: field,
        sortOrder: "desc",
      });
    }
  };

  const filteredQuestions = questions.filter((question) =>
    question.text.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 mx-auto max-w-7xl">
      <div className="flex items-center mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin")}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-4xl font-bold">Content Management</h1>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100 p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={filters.type}
                onValueChange={(value) =>
                  setFilters({ ...filters, type: value })
                }
              >
                <SelectTrigger className="w-[150px]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>Type</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="behavioral">Behavioral</SelectItem>
                  <SelectItem value="product_sense">Product Sense</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Question</DialogTitle>
                <DialogDescription>
                  Create a new interview question for users to practice with.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right">Question Type</label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select question type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="behavioral">Behavioral</SelectItem>
                      <SelectItem value="product_sense">
                        Product Sense
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <label className="text-right pt-2">Question Text</label>
                  <Textarea
                    className="col-span-3"
                    value={formData.text}
                    onChange={(e) =>
                      setFormData({ ...formData, text: e.target.value })
                    }
                    placeholder="Enter the question text"
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <label className="text-right pt-2">Sample Response</label>
                  <Textarea
                    className="col-span-3 min-h-[150px]"
                    value={formData.sampleResponse}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sampleResponse: e.target.value,
                      })
                    }
                    placeholder="Enter a sample response for this question"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setIsAddDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddQuestion}
                  className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
                >
                  Add Question
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Edit Question</DialogTitle>
                <DialogDescription>
                  Update the interview question details.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right">Question Type</label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select question type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="behavioral">Behavioral</SelectItem>
                      <SelectItem value="product_sense">
                        Product Sense
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <label className="text-right pt-2">Question Text</label>
                  <Textarea
                    className="col-span-3"
                    value={formData.text}
                    onChange={(e) =>
                      setFormData({ ...formData, text: e.target.value })
                    }
                    placeholder="Enter the question text"
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <label className="text-right pt-2">Sample Response</label>
                  <Textarea
                    className="col-span-3 min-h-[150px]"
                    value={formData.sampleResponse}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sampleResponse: e.target.value,
                      })
                    }
                    placeholder="Enter a sample response for this question"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setIsEditDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEditQuestion}
                  className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
                >
                  Update Question
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => toggleSortOrder("text")}
                    className="flex items-center gap-1 p-0 h-auto font-semibold"
                  >
                    Question
                    {filters.sortBy === "text" && (
                      <ArrowUpDown className="h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => toggleSortOrder("type")}
                    className="flex items-center gap-1 p-0 h-auto font-semibold"
                  >
                    Type
                    {filters.sortBy === "type" && (
                      <ArrowUpDown className="h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => toggleSortOrder("created_at")}
                    className="flex items-center gap-1 p-0 h-auto font-semibold"
                  >
                    Created At
                    {filters.sortBy === "created_at" && (
                      <ArrowUpDown className="h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuestions.length > 0 ? (
                filteredQuestions.map((question) => (
                  <TableRow key={question.id}>
                    <TableCell className="max-w-[300px] truncate">
                      {question.text}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${question.type === "behavioral" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}
                      >
                        {question.type === "product_sense"
                          ? "Product Sense"
                          : "Behavioral"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(question.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(question)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteQuestion(question.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    No questions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
